package server

import (
	"fmt"
	"html/template"
	"net/http"
	"net/url"
	"os"
	"path"

	"github.com/coreos/pkg/capnslog"
	"github.com/coreos/pkg/health"

	"github.com/coreos-inc/bridge/auth"
	"github.com/coreos-inc/bridge/version"
)

const (
	BridgeAPIVersion      = "v1"
	K8sAPIVersion         = "v1"
	IndexPageTemplateName = "index.html"

	AuthLoginEndpoint         = "/auth/login"
	AuthLogoutEndpoint        = "/auth/logout"
	AuthLoginCallbackEndpoint = "/auth/callback"
	AuthErrorURL              = "/error"
	AuthSuccessURL            = "/"
)

var (
	plog = capnslog.NewPackageLogger("github.com/coreos-inc/bridge", "server")
)

type jsGlobals struct {
	K8sAPIVersion          string `json:"k8sAPIVersion"`
	AuthDisabled           bool   `json:"authDisabled"`
	NewUserAuthCallbackURL string `json:"newUserAuthCallbackURL"`
}

type Server struct {
	K8sProxyConfig         *ProxyConfig
	DexProxyConfig         *ProxyConfig
	PublicDir              string
	TectonicVersion        string
	Auther                 *auth.Authenticator
	NewUserAuthCallbackURL *url.URL
}

func (s *Server) AuthDisabled() bool {
	return s.Auther == nil
}

func (s *Server) HTTPHandler() http.Handler {
	mux := http.NewServeMux()

	var k8sHandler http.Handler = newProxy(s.K8sProxyConfig)
	if !s.AuthDisabled() {
		k8sHandler = authMiddleware(s.Auther, k8sHandler)
	}
	mux.Handle("/api/kubernetes/", http.StripPrefix("/api/kubernetes/", k8sHandler))

	if !s.AuthDisabled() {
		mux.HandleFunc(AuthLoginEndpoint, s.Auther.LoginFunc)
		mux.HandleFunc(AuthLogoutEndpoint, s.Auther.LogoutFunc)
		mux.HandleFunc(AuthLoginCallbackEndpoint, s.Auther.CallbackFunc)
	}

	if s.DexProxyConfig != nil {
		mux.Handle("/api/dex/", http.StripPrefix("/api/dex/", newProxy(s.DexProxyConfig)))
	}

	mux.HandleFunc("/api/", notFoundHandler)

	staticHandler := http.StripPrefix("/static/", http.FileServer(http.Dir(s.PublicDir)))
	mux.Handle("/static/", staticHandler)

	mux.HandleFunc("/health", health.Checker{
		Checks: []health.Checkable{},
	}.ServeHTTP)

	useVersionHandler := s.versionHandler
	if !s.AuthDisabled() {
		useVersionHandler = authMiddleware(s.Auther, http.HandlerFunc(s.versionHandler))
	}
	mux.HandleFunc("/version", useVersionHandler)

	mux.HandleFunc("/", s.indexHandler)

	return http.Handler(mux)
}

func (s *Server) indexHandler(w http.ResponseWriter, r *http.Request) {
	jsg := &jsGlobals{
		K8sAPIVersion:          K8sAPIVersion,
		AuthDisabled:           s.AuthDisabled(),
		NewUserAuthCallbackURL: s.NewUserAuthCallbackURL.String(),
	}
	tpl := template.New(IndexPageTemplateName)
	tpl.Delims("[[", "]]")
	tpls, err := tpl.ParseFiles(path.Join(s.PublicDir, IndexPageTemplateName))
	if err != nil {
		fmt.Printf("index.html not found in configured public-dir path: %v", err)
		os.Exit(1)
	}

	if err := tpls.ExecuteTemplate(w, IndexPageTemplateName, jsg); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func (s *Server) versionHandler(w http.ResponseWriter, r *http.Request) {
	sendResponse(w, http.StatusOK, struct {
		Version        string `json:"version"`
		ConsoleVersion string `json:"consoleVersion"`
	}{
		Version:        s.TectonicVersion,
		ConsoleVersion: version.Version,
	})
}

func notFoundHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusNotFound)
	w.Write([]byte("not found"))
}
