import React from 'react';
import { Notification } from '../types';
import { Bell, Briefcase, MessageCircle, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification, onMarkAsRead }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'application':
        return <Briefcase className="h-5 w-5 text-blue-500" />;
      case 'message':
        return <MessageCircle className="h-5 w-5 text-green-500" />;
      case 'status':
        if (notification.message.includes('accepted')) {
          return <CheckCircle className="h-5 w-5 text-green-500" />;
        } else if (notification.message.includes('rejected')) {
          return <XCircle className="h-5 w-5 text-red-500" />;
        } else {
          return <AlertCircle className="h-5 w-5 text-yellow-500" />;
        }
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'recently';
    }
  };

  return (
    <div 
      className={`p-4 border-b border-gray-200 last:border-b-0 ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
      onClick={() => !notification.read && onMarkAsRead(notification.id)}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-3">
          {getIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between">
            <p className={`text-sm font-medium ${notification.read ? 'text-gray-900' : 'text-blue-800'}`}>
              {notification.title}
            </p>
            <p className="text-xs text-gray-500">
              {getTimeAgo(notification.created_at)}
            </p>
          </div>
          <p className={`text-sm ${notification.read ? 'text-gray-600' : 'text-blue-700'}`}>
            {notification.message}
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotificationItem;