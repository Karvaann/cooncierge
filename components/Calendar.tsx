"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import apiClient from "@/services/apiClient";
import { getAuthToken } from "@/services/storage/authStorage";

// Type definitions
interface CalendarProps {
  calenderShow: boolean;
  setCalenderShow: (show: boolean) => void;
}

interface TaskData {
  activity: string;
  status?: 'completed' | 'pending' | 'in-progress';
  priority?: 'low' | 'medium' | 'high';
  assignee?: string;
  dueTime?: string;
}

interface ApiResponse {
  logsByDay?: Record<string, TaskData[]>;
  totalTasks?: number;
  completedTasks?: number;
  pendingTasks?: number;
}

type CalendarWeek = (number | null)[];
type CalendarMonth = CalendarWeek[];

// Constants
const DAYS: readonly string[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

const MONTH_NAMES: readonly string[] = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
] as const;

// Optimized month calculation function
const getMonthDays = (year: number, month: number): CalendarMonth => {
  const date = new Date(year, month, 1);
  const startDay = date.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendar: CalendarMonth = [];
  let week: CalendarWeek = Array(startDay).fill(null);

  for (let i = 1; i <= daysInMonth; i++) {
    week.push(i);
    if (week.length === 7) {
      calendar.push(week);
      week = [];
    }
  }

  if (week.length > 0) {
    while (week.length < 7) week.push(null);
    calendar.push(week);
  }

  return calendar;
};

const Calendar: React.FC<CalendarProps> = ({ calenderShow, setCalenderShow }) => {
  const today = new Date();
  const [year, setYear] = useState<number>(today.getFullYear());
  const [month, setMonth] = useState<number>(today.getMonth());
  const [data, setData] = useState<ApiResponse>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Memoized calendar calculation
  const calendar = useMemo(() => getMonthDays(year, month), [year, month]);

  // Memoized month name
  const currentMonthName = useMemo(() => MONTH_NAMES[month], [month]);

  // Mock data for demonstration (replace with actual API when ready)
  const mockData = useMemo((): ApiResponse => ({
    logsByDay: {
      '5': [
        { activity: 'Flight Booking - Mumbai', status: 'completed' as const },
        { activity: 'Hotel Confirmation', status: 'pending' as const }
      ],
      '12': [
        { activity: 'Client Meeting', status: 'completed' as const }
      ],
      '18': [
        { activity: 'Travel Documentation', status: 'in-progress' as const },
        { activity: 'Visa Processing', status: 'pending' as const }
      ],
      '25': [
        { activity: 'Package Delivery', status: 'completed' as const }
      ]
    },
    totalTasks: 6,
    completedTasks: 3,
    pendingTasks: 2
  }), []);

  // Set mock data (replace with actual API call when ready)
  useEffect(() => {
    setData(mockData);
    setLoading(false);
  }, [mockData]);

  // Optimized data fetching with error handling (commented for now)
  const fetchSummaryData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const token = getAuthToken();

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await apiClient.get<ApiResponse>(
        `/logs/monthly-summary/689000000000000000000003`,
        {
          params: { month, year },
          timeout: 10000,
        }
      );

      setData(response.data);
    } catch (err) {
      console.error("Failed to fetch calendar data:", err);
      setError("Failed to load calendar data");
      setData(mockData); // Fallback to mock data
    } finally {
      setLoading(false);
    }
  }, [month, year, mockData]);

  // Memoized navigation handlers
  const handlePrev = useCallback(() => {
    if (month === 0) {
      setMonth(11);
      setYear(prev => prev - 1);
    } else {
      setMonth(prev => prev - 1);
    }
  }, [month]);

  const handleNext = useCallback(() => {
    if (month === 11) {
      setMonth(0);
      setYear(prev => prev + 1);
    } else {
      setMonth(prev => prev + 1);
    }
  }, [month]);

  const toggleCalendar = useCallback(() => {
    setCalenderShow(!calenderShow);
  }, [calenderShow, setCalenderShow]);

  // Memoized day headers with modern styling
  const dayHeaders = useMemo(() =>
    DAYS.map((day) => (
      <div
        key={day}
        className="h-14 flex items-center justify-center bg-gray-50 font-semibold text-gray-700 text-sm border-r border-gray-100 last:border-r-0"
      >
        {day}
      </div>
    )), []
  );

  // Memoized calendar cells
  const calendarCells = useMemo(() => 
    calendar.map((week, weekIdx) =>
      week.map((date, i) => {
        const hasData = date && data.logsByDay?.[date];
        const tasks = hasData ? data.logsByDay![date] || [] : [];

        return (
          <div
            key={`${weekIdx}-${i}`}
            className={`h-36 p-3 border-r border-b border-gray-100 last:border-r-0 transition-all duration-200 hover:bg-gray-50 ${
              hasData ? "bg-blue-50/30" : "bg-white"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              {date ? (
                <>
                  <span className={`text-sm font-medium ${
                    hasData ? "text-blue-900" : "text-gray-700"
                  }`}>
                    {date}
                  </span>
                  {tasks.length > 0 && (
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                      {tasks.length}
                    </span>
                  )}
                </>
              ) : null}
            </div>

            <div className="space-y-1 max-h-24 overflow-y-auto">
              {tasks.map((task, idx) => {
                const statusColors = {
                  completed: 'bg-green-100 text-green-800 border-green-200',
                  pending: 'bg-orange-100 text-orange-800 border-orange-200',
                  'in-progress': 'bg-blue-100 text-blue-800 border-blue-200'
                };

                const statusColor = statusColors[task.status as keyof typeof statusColors] || 'bg-gray-100 text-gray-800 border-gray-200';

                return (
                  <div
                    key={`${date}-${idx}`}
                    className={`px-2 py-1 rounded-md border text-xs truncate hover:shadow-sm transition-all cursor-pointer ${statusColor}`}
                    title={task.activity}
                  >
                    {task.activity}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })
    ), [calendar, data.logsByDay]
  );

  if (error) {
    return (
      <div className="w-full min-h-screen p-6 bg-white text-sm">
        <div className="text-center text-red-600">
          <p>Error: {error}</p>
          <button 
            onClick={fetchSummaryData}
            className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen p-6 bg-gray-50 text-sm">
      {/* Enhanced Header with Modern Design */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrev}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                aria-label="Previous month"
                disabled={loading}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-2xl font-bold text-gray-900 min-w-[200px] text-center">
                {currentMonthName} {year}
              </h2>
              <button
                onClick={handleNext}
                className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                aria-label="Next month"
                disabled={loading}
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Calendar Stats */}
            <div className="flex items-center gap-4 ml-8">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Active Tasks</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Pending</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className="flex items-center gap-2 px-4 py-2 bg-[#114958] text-white rounded-lg hover:bg-[#0d3a45] transition-colors font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Task
            </button>
            <button
              type="button"
              onClick={toggleCalendar}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={calenderShow ? "M5 15l7-7 7 7" : "M19 9l-7 7-7-7"} />
              </svg>
              {calenderShow ? "Collapse" : "Expand"}
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#114958]"></div>
          <span className="ml-3 text-gray-600">Loading calendar data...</span>
        </div>
      )}

      {/* Modern Calendar Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {dayHeaders}
        </div>
        <div className="grid grid-cols-7">
          {calendarCells}
        </div>
      </div>
    </div>
  );
};

export default React.memo(Calendar);
