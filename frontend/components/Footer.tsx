export function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-5">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-primary rounded-sm flex items-center justify-center shrink-0">
              <span className="text-[8px] font-bold text-primary-foreground leading-none">V</span>
            </div>
            <span className="font-sans text-sm font-medium text-foreground tracking-tight">VIGIL</span>
            <span className="text-muted-foreground text-sm">·</span>
            <span className="text-sm text-muted-foreground">Your student health copilot</span>
          </div>
          <span className="font-mono text-2xs text-muted-foreground">
            © {new Date().getFullYear()} VIGIL
          </span>
        </div>
      </div>
    </footer>
  );
}
