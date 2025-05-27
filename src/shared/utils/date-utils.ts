interface FirestoreTimestamp {
  seconds: number;
  nanoseconds: number;
}

export function isFirestoreTimestamp(value: any): value is FirestoreTimestamp {
  return (
    typeof value === 'object' &&
    value !== null &&
    'seconds' in value &&
    'nanoseconds' in value &&
    typeof value.seconds === 'number' &&
    typeof value.nanoseconds === 'number'
  );
}

export const formatDate = (date: Date | FirestoreTimestamp | string | number | undefined): string => {
  if (!date) return '';

  try {
    let dateObj: Date;

    // Handle Firestore Timestamp
    if (isFirestoreTimestamp(date)) {
      dateObj = new Date(date.seconds * 1000);
    } else {
      dateObj = new Date(date);
    }

    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      return '';
    }

    // Format: "Jan 1, 2024 at 3:45 PM"
    return dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}; 