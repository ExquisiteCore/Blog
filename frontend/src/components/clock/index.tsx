'use client';

import * as React from 'react';

export const Clock = () => {
  const [date, setDate] = React.useState(new Date());

  React.useEffect(() => {
    const timer = setInterval(() => {
      setDate(new Date());
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  // 格式化日期：YYYY-MM-DD
  const formatDate = () => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 获取星期
  const getWeekday = () => {
    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    return weekdays[date.getDay()];
  };

  // 格式化时间：HH:MM:SS
  const formatTime = () => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="flex flex-col items-center">
      <div className="flex items-center mb-2">
        <div className="w-8 h-8 rounded-full bg-orange-400 flex items-center justify-center mr-2">
          <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
        </div>
        <span className="text-lg font-medium">电子时钟</span>
      </div>
      <div className="text-gray-500 text-sm mb-1">
        {formatDate()} {getWeekday()}
      </div>
      <div className="text-4xl font-bold tracking-wider">
        {formatTime()}
      </div>
    </div>
  );
};