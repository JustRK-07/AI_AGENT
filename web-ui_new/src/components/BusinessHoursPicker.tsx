/**
 * Business Hours Picker Component
 * Allows users to configure business hours with timezone support
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, Plus, Trash2, Copy } from 'lucide-react';
import type { BusinessHours, DayOfWeek } from '@/templates/types';

interface BusinessHoursPickerProps {
  value: BusinessHours;
  onChange: (hours: BusinessHours) => void;
  disabled?: boolean;
}

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
];

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona (MST)' },
  { value: 'America/Anchorage', label: 'Alaska Time' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time' },
  { value: 'Europe/London', label: 'UK Time (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Central European Time' },
  { value: 'Asia/Tokyo', label: 'Japan Time' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time' },
];

export function BusinessHoursPicker({ value, onChange, disabled = false }: BusinessHoursPickerProps) {
  const [copyFromDay, setCopyFromDay] = useState<DayOfWeek | ''>('');

  const handleTimezoneChange = (timezone: string) => {
    onChange({
      ...value,
      timezone,
    });
  };

  const handleScheduleChange = (day: DayOfWeek, timeRange: string) => {
    onChange({
      ...value,
      schedule: {
        ...value.schedule,
        [day]: timeRange,
      },
    });
  };

  const handleClearDay = (day: DayOfWeek) => {
    const newSchedule = { ...value.schedule };
    delete newSchedule[day];
    onChange({
      ...value,
      schedule: newSchedule,
    });
  };

  const handleCopyFrom = (sourceDay: DayOfWeek) => {
    if (!sourceDay || !value.schedule[sourceDay]) return;

    const timeRange = value.schedule[sourceDay];
    const newSchedule = { ...value.schedule };

    // Copy to all days that don't have times set
    DAYS.forEach(({ value: day }) => {
      if (!newSchedule[day]) {
        newSchedule[day] = timeRange;
      }
    });

    onChange({
      ...value,
      schedule: newSchedule,
    });
    setCopyFromDay('');
  };

  const handleSetWeekdays = () => {
    const newSchedule = { ...value.schedule };
    const defaultHours = '09:00-17:00';

    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach((day) => {
      if (!newSchedule[day as DayOfWeek]) {
        newSchedule[day as DayOfWeek] = defaultHours;
      }
    });

    onChange({
      ...value,
      schedule: newSchedule,
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-base">Business Hours</CardTitle>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSetWeekdays}
            disabled={disabled}
          >
            <Plus className="h-4 w-4 mr-1" />
            9-5 Weekdays
          </Button>
        </div>
        <CardDescription className="text-xs">
          Configure when your agent should be active
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timezone Selector */}
        <div>
          <label className="text-sm font-medium mb-2 block">Timezone</label>
          <Select
            value={value.timezone}
            onValueChange={handleTimezoneChange}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz.value} value={tz.value}>
                  {tz.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Copy From Helper */}
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <Copy className="h-4 w-4 text-gray-600" />
          <Select value={copyFromDay} onValueChange={(v) => setCopyFromDay(v as DayOfWeek)} disabled={disabled}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Copy hours to empty days..." />
            </SelectTrigger>
            <SelectContent>
              {DAYS.filter(({ value: day }) => value.schedule[day]).map(({ value: day, label }) => (
                <SelectItem key={day} value={day}>
                  {label} ({value.schedule[day]})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => copyFromDay && handleCopyFrom(copyFromDay as DayOfWeek)}
            disabled={disabled || !copyFromDay}
          >
            Copy
          </Button>
        </div>

        {/* Day Schedule */}
        <div className="space-y-2">
          {DAYS.map(({ value: day, label }) => (
            <div key={day} className="flex items-center gap-2">
              <label className="text-sm font-medium w-24">{label}</label>
              <Input
                type="text"
                placeholder="09:00-17:00"
                value={value.schedule[day] || ''}
                onChange={(e) => handleScheduleChange(day, e.target.value)}
                disabled={disabled}
                className="flex-1 text-sm"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleClearDay(day)}
                disabled={disabled || !value.schedule[day]}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-500 mt-2">
          Format: HH:MM-HH:MM (e.g., 09:00-17:00). Leave blank for closed days.
        </p>
      </CardContent>
    </Card>
  );
}
