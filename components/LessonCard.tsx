
import React from 'react';
import { Lesson, LessonStatus } from '../types';

interface LessonCardProps {
  lesson: Lesson;
  onClick: (id: string) => void;
}

const LessonCard: React.FC<LessonCardProps> = ({ lesson, onClick }) => {
  const getStatusColor = (status: LessonStatus) => {
    switch (status) {
      case LessonStatus.COMPLETED: return 'bg-green-100 text-green-700 border-green-200';
      case LessonStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-700 border-blue-200';
      case LessonStatus.TODO: return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div 
      onClick={() => onClick(lesson.id)}
      className="group bg-white rounded-2xl border border-gray-100 p-6 transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <span className={`text-xs font-bold px-2 py-1 rounded-md border ${getStatusColor(lesson.status)}`}>
            {lesson.status.toUpperCase()}
          </span>
          <span className="text-gray-400 text-xs font-medium">
            {lesson.year} • T{lesson.quarter}
          </span>
        </div>
        <h3 className="text-xl font-serif font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
          {lesson.title}
        </h3>
        <p className="text-gray-500 text-sm line-clamp-3 mb-4 leading-relaxed">
          {lesson.summary}
        </p>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-gray-50">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center">
            <svg className="w-3 h-3 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
          </div>
          <span className="text-xs font-medium text-gray-600">{lesson.commentator}</span>
        </div>
        <span className="text-xs text-blue-500 font-semibold">{lesson.theme}</span>
      </div>
    </div>
  );
};

export default LessonCard;
