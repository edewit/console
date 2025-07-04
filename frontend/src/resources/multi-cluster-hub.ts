/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'
import { listResources } from './utils/resource-request'

export const MultiClusterHubApiVersion = 'operator.open-cluster-management.io/v1'
export type MultiClusterHubApiVersionType = 'operator.open-cluster-management.io/v1'

export const MultiClusterHubKind = 'MultiClusterHub'
export type MultiClusterHubKindType = 'MultiClusterHub'

export const MultiClusterHubDefinition: IResourceDefinition = {
  apiVersion: MultiClusterHubApiVersion,
  kind: MultiClusterHubKind,
}

interface MultiClusterHubComponent {
  name: string
  enabled: boolean
}
export interface MultiClusterHub extends IResource {
  apiVersion: MultiClusterHubApiVersionType
  kind: MultiClusterHubKindType
  metadata: Metadata
  spec?: { overrides?: { components?: MultiClusterHubComponent[] } }
  status: {
    currentVersion: string
  }
}

export function listMultiClusterHubs() {
  return listResources<MultiClusterHub>({
    apiVersion: MultiClusterHubApiVersion,
    kind: MultiClusterHubKind,
  })
}
