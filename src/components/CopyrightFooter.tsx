export function CopyrightFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`py-6 text-center text-sm text-gray-500 ${className}`}>
      <p>© {new Date().getFullYear()} All rights reserved by Rk prasad</p>
    </footer>
  );
}
