import * as Notifications from 'expo-notifications';

// Show alerts + sound by default
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Permissions
export const registerForPushNotificationsAsync = async () => {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return false;
  }
  return true;
};

// Improved time parser - ab "11:18pm" bhi accept karega
const parseTimeString = (timeString) => {
  if (!timeString) return { hours: 9, minutes: 0 };
  
  console.log(`⏰ Parsing time: "${timeString}"`);
  
  // Clean the time string - remove extra spaces
  const cleanTime = timeString.trim().toLowerCase();
  
  // Handle formats like "11:18pm", "11:18 pm", "11:18am", "11:18 am"
  const ampmMatch = cleanTime.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/);
  if (ampmMatch) {
    let hours = parseInt(ampmMatch[1], 10);
    const minutes = parseInt(ampmMatch[2], 10);
    const meridiem = ampmMatch[3];
    
    console.log(`📅 Parsed: hours=${hours}, minutes=${minutes}, meridiem=${meridiem}`);
    
    // Convert to 24-hour format
    if (meridiem === 'pm' && hours < 12) {
      hours += 12;
    } else if (meridiem === 'am' && hours === 12) {
      hours = 0;
    }
    
    // If no AM/PM specified, assume it's already in 24-hour format
    // but if hours > 12, it's probably PM
    if (!meridiem && hours > 12) {
      hours = hours; // keep as is for 24-hour format
    }
    
    console.log(`🕒 Final 24-hour time: ${hours}:${minutes}`);
    return { hours, minutes };
  }
  
  // Handle formats like "11pm", "11 am" (without minutes)
  const simpleMatch = cleanTime.match(/^(\d{1,2})\s*(am|pm)$/);
  if (simpleMatch) {
    let hours = parseInt(simpleMatch[1], 10);
    const meridiem = simpleMatch[2];
    const minutes = 0;
    
    if (meridiem === 'pm' && hours < 12) {
      hours += 12;
    } else if (meridiem === 'am' && hours === 12) {
      hours = 0;
    }
    
    return { hours, minutes };
  }
  
  // Default fallback
  console.log(`⚠️ Using default time for: ${timeString}`);
  return { hours: 9, minutes: 0 };
};

const nextDateFromTimeTodayOrTomorrow = (hours, minutes) => {
  const now = new Date();
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);
  
  console.log(`📅 Now: ${now}, Target: ${target}`);
  
  if (target <= now) {
    // if time already passed today, schedule for tomorrow
    target.setDate(target.getDate() + 1);
    console.log(`⏩ Time passed, scheduling for tomorrow: ${target}`);
  } else {
    console.log(`✅ Scheduling for today: ${target}`);
  }
  
  return target;
};

/**
 * Schedules a notification based on medicine fields.
 */
export const schedulePushNotification = async (med) => {
  const { id, name, dosage, timeToTake, date, daysOfWeek, frequency } = med;
  
  if (!timeToTake) {
    console.log(`❌ No time specified for ${name}, skipping notification`);
    return null;
  }

  const { hours, minutes } = parseTimeString(timeToTake);

  const content = {
    title: `💊 Time to take ${name}`,
    body: `It's time to take your ${name}${dosage ? ` (${dosage})` : ''}`,
    sound: 'default',
    data: { 
      medicineId: id,
      medicineName: name,
      scheduledTime: timeToTake
    },
  };

  console.log(`🕒 Scheduling ${name} at ${timeToTake} -> ${hours}:${minutes} (24-hour)`);

  try {
    // 1) Exact one-time date (YYYY-MM-DD)
    if (date) {
      const [y, m, d] = date.split('-').map((n) => parseInt(n, 10));
      const when = new Date(y, (m - 1), d, hours, minutes, 0, 0);
      
      console.log(`📅 One-time date: ${date}, Time: ${hours}:${minutes}`);
      
      if (when <= new Date()) {
        // If date is in past, schedule for tomorrow at same time
        const next = nextDateFromTimeTodayOrTomorrow(hours, minutes);
        console.log(`📅 Date passed, scheduling for tomorrow: ${next}`);
        
        const notificationId = await Notifications.scheduleNotificationAsync({
          content,
          trigger: next,
        });
        
        console.log(`✅ Scheduled one-time notification for ${name}, ID: ${notificationId}`);
        return notificationId;
      }
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content,
        trigger: when,
      });
      
      console.log(`✅ Scheduled one-time notification for ${name} on ${date}, ID: ${notificationId}`);
      return notificationId;
    }

    // 2) Weekly (array of weekdays 1..7)
    if (Array.isArray(daysOfWeek) && daysOfWeek.length > 0) {
      console.log(`📅 Weekly schedule for ${name} on days: ${daysOfWeek}`);
      
      const ids = [];
      for (const weekday of daysOfWeek) {
        const id = await Notifications.scheduleNotificationAsync({
          content,
          trigger: { 
            weekday, 
            hour: hours, 
            minute: minutes, 
            repeats: true 
          },
        });
        ids.push(id);
      }
      
      const joinedIds = ids.join(',');
      console.log(`✅ Scheduled weekly notifications for ${name}, IDs: ${joinedIds}`);
      return joinedIds;
    }

    // 3) Daily (default) - based on frequency or fallback to daily
    if ((frequency && frequency.toLowerCase().includes('daily')) || !frequency) {
      console.log(`📅 Daily schedule for ${name} at ${hours}:${minutes}`);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content,
        trigger: { 
          hour: hours, 
          minute: minutes, 
          repeats: true 
        },
      });
      
      console.log(`✅ Scheduled daily notification for ${name}, ID: ${notificationId}`);
      return notificationId;
    }

    // 4) For other frequencies, schedule next occurrence
    const first = nextDateFromTimeTodayOrTomorrow(hours, minutes);
    const notificationId = await Notifications.scheduleNotificationAsync({
      content,
      trigger: first,
    });
    
    console.log(`✅ Scheduled notification for ${name} at ${first}, ID: ${notificationId}`);
    return notificationId;

  } catch (error) {
    console.error(`❌ Error scheduling notification for ${name}:`, error);
    throw error;
  }
};

export const cancelScheduledNotification = async (notificationIdOrIds) => {
  try {
    if (!notificationIdOrIds) return true;
    
    const ids = String(notificationIdOrIds).split(',');
    let cancelledCount = 0;
    
    for (const id of ids) {
      const trimmedId = id.trim();
      if (trimmedId) {
        await Notifications.cancelScheduledNotificationAsync(trimmedId);
        cancelledCount++;
      }
    }
    
    console.log(`✅ Cancelled ${cancelledCount} notification(s)`);
    return true;
  } catch (e) {
    console.error('❌ Error cancelling notification(s):', e);
    return false;
  }
};

export const cancelAllNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('✅ Cancelled all scheduled notifications');
    return true;
  } catch (e) {
    console.error('❌ Error cancelling all notifications:', e);
    return false;
  }
};