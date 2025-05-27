export default function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="40" height="40" rx="8" fill="#3B82F6" />
      <circle cx="20" cy="12" r="4" fill="white" />
      <circle cx="12" cy="20" r="4" fill="white" />
      <circle cx="28" cy="20" r="4" fill="white" />
      <circle cx="20" cy="28" r="4" fill="white" />
    </svg>
  );
} 