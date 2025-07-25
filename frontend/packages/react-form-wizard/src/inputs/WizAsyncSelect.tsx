/* Copyright Contributors to the Open Cluster Management project */
import {
    Button,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    InputGroup,
    InputGroupItem,
    MenuFooter,
    MenuToggle,
    MenuToggleElement,
    Select as PfSelect,
    SelectList,
    SelectOption,
    TextInputGroup,
    TextInputGroupMain,
    TextInputGroupUtilities,
} from '@patternfly/react-core'
import { TimesIcon } from '@patternfly/react-icons'
import { FormEvent, ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { SpinnerButton } from '../components/SpinnerButton'
import { SyncButton } from '../components/SyncButton'
import { DisplayMode } from '../contexts/DisplayModeContext'
import { InputCommonProps, getSelectPlaceholder, useInput } from './Input'
import { WizFormGroup } from './WizFormGroup'

import './Select.css'

type WizAsyncSelectProps = InputCommonProps<string> & {
  label: string
  placeholder?: string
  isCreatable?: boolean
  asyncCallback?: () => Promise<string[]>
  footer?: ReactNode
}

export function WizAsyncSelect(props: WizAsyncSelectProps) {
    const { asyncCallback, isCreatable, footer } = props
    const { displayMode, value, setValue, validated, hidden, id, disabled } = useInput(props)
    const placeholder = getSelectPlaceholder(props)
    const [open, setOpen] = useState(false)
    const [options, setOptions] = useState<string[]>([])
    const [filteredOptions, setFilteredOptions] = useState<string[]>([])
    const [loading, setLoading] = useState(false)

    const onSelect = useCallback(
        (selectedString: string) => {
            setValue(selectedString)
            setOpen(false)
        },
        [setValue]
    )

    const handleSetOptions = useCallback((o: string[]) => {
        if (o.length > 0) {
            setFilteredOptions(o)
        } else {
            setFilteredOptions([NoResults])
        }
    }, [])

    const sync = useCallback(() => {
        if (displayMode !== DisplayMode.Step) return
        if (asyncCallback) {
            setLoading((loading) => {
                if (loading) return loading
                if (asyncCallback) {
                    asyncCallback()
                        .then((options) => {
                            if (Array.isArray(options) && options.every((option) => typeof option === 'string')) {
                                setOptions(options)
                                setFilteredOptions(options)
                            } else {
                                // eslint-disable-next-line no-console
                                console.warn('AsyncSelect: options is not an array of strings')
                                setOptions([])
                            }
                        })
                        .catch(() => null)
                        .finally(() => setLoading(false))
                    return true
                }
                return false
            })
        }
    }, [asyncCallback, displayMode])

  useEffect(() => sync(), [sync])

    if (hidden) return null

    if (displayMode === DisplayMode.Details) {
        if (!value) return null
        return (
            <DescriptionListGroup>
                <DescriptionListTerm>{props.label}</DescriptionListTerm>
                <DescriptionListDescription id={id}>{value}</DescriptionListDescription>
            </DescriptionListGroup>
        )
    }

    return (
        <WizFormGroup {...props} id={id}>
            <InputGroup>
                <InputGroupItem isFill>
                    <PfSelect
                        onOpenChange={(isOpen) => {
                            !isOpen && setOpen(false)
                        }}
                        isOpen={open}
                        toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                            <InputDropdown
                                disabled={disabled || (loading && !isCreatable)}
                                validated={validated}
                                placeholder={placeholder}
                                options={options}
                                setOptions={handleSetOptions}
                                toggleRef={toggleRef}
                                value={value}
                                onSelect={onSelect}
                                open={open}
                                setOpen={setOpen}
                            />
                        )}
                        selected={value}
                        onSelect={(_event, value) => onSelect(value?.toString() ?? '')}
                        shouldFocusFirstItemOnOpen={false}
                        // footer={props.footer}
                    >
                        <SelectList>
                            {filteredOptions.map((option, index) => {
                                const isLastItem = index === filteredOptions.length - 1
                                const isSingleItem = filteredOptions.length === 1
                                const shouldSkipLastItem = isLastItem && !isSingleItem
                                const shouldShowCreatePrefix = isSingleItem && isCreatable && value !== option

                                if (shouldSkipLastItem) {
                                    return null
                                }

                                const displayText = shouldShowCreatePrefix ? `${CreateOption} ${option}` : isSingleItem ? NoResults : option

                                return (
                                    <SelectOption key={option} value={option} isDisabled={displayText === NoResults}>
                                        {displayText}
                                    </SelectOption>
                                )
                            })}
                            {footer && <MenuFooter>{footer}</MenuFooter>}
                        </SelectList>
                    </PfSelect>
                </InputGroupItem>
                {props.asyncCallback && loading && <SpinnerButton />}
                {props.asyncCallback && !loading && <SyncButton onClick={sync} />}
            </InputGroup>
        </WizFormGroup>
    )
}

const NoResults = 'No results found'
const CreateOption = 'Create new option'

type InputDropdownProps = {
    disabled?: boolean
    validated?: 'error'
    options: string[]
    setOptions: (options: string[]) => void
    placeholder: string
    value: string
    onSelect: (value: string) => void
    toggleRef: React.Ref<MenuToggleElement>
    open: boolean
    setOpen: (open: boolean) => void
}

const InputDropdown = ({
    disabled,
    validated,
    options,
    setOptions,
    placeholder,
    value,
    onSelect,
    toggleRef,
    open,
    setOpen,
}: InputDropdownProps) => {
    const [inputValue, setInputValue] = useState('')
    const textInputRef = useRef<HTMLInputElement>(null)
    const onInputClick = useCallback(() => setOpen(!open), [open, setOpen])

    useEffect(
        () => setOptions([...options.filter((option) => option.toLowerCase().includes(inputValue.toLowerCase())), inputValue]),
        [inputValue, options, setOptions]
    )

    const onClear = useCallback(() => {
        onSelect('')
        setInputValue('')
        textInputRef?.current?.focus()
    }, [onSelect])

    const onInputKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (!open) {
                setOpen(true)
            }

            switch (event.key) {
                case 'Backspace':
                    onSelect('')
                    break
            }
        },
        [onSelect, open, setOpen]
    )

    const onTextInputChange = useCallback((_event: FormEvent<HTMLInputElement>, value: string) => {
        setInputValue(value)
    }, [])

    return (
        <MenuToggle
            variant="typeahead"
            ref={toggleRef}
            onClick={() => setOpen(!open)}
            isExpanded={open}
            isDisabled={disabled}
            isFullWidth
            status={validated === 'error' ? 'danger' : undefined}
        >
            <TextInputGroup isPlain>
                <TextInputGroupMain
                    value={value || inputValue}
                    onClick={onInputClick}
                    onChange={onTextInputChange}
                    onKeyDown={onInputKeyDown}
                    autoComplete="off"
                    innerRef={textInputRef}
                    placeholder={placeholder}
                    role="combobox"
                    isExpanded={open}
                    aria-controls="select-typeahead-listbox"
                />

                <TextInputGroupUtilities {...(!inputValue && !value ? { style: { display: 'none' } } : {})}>
                    <Button variant="plain" onClick={onClear}>
                        <TimesIcon aria-hidden />
                    </Button>
                </TextInputGroupUtilities>
            </TextInputGroup>
        </MenuToggle>
    )
}
