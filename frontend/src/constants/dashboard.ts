export interface SelectOption {
  value: string;
  label: string;
}

export const DEVICE_OPTIONS: SelectOption[] = [
  { value: 'BESS-01', label: 'BESS-01 (主儲能系統)' },
  { value: 'BESS-02', label: 'BESS-02 (備用儲能系統)' },
  { value: 'Solar-01', label: 'Solar-01 (光電陣列)' },
];

export const ATTRIBUTE_OPTIONS = [
  { value: 'voltage', label: 'Voltage (電壓)' },
  { value: 'power', label: 'Power (功率)' },
  { value: 'soc', label: 'SoC (電池電量)' },
] as const;
