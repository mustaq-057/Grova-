import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("UI error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
          <h1 className="text-lg font-semibold">Something went wrong</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            {import.meta.env.PROD ? (
              <>Something broke on this screen. Refresh the page and sign in again if needed.</>
            ) : (
              <>
                Refresh the page. If it keeps happening, run{" "}
                <code className="rounded bg-muted px-1">pnpm dev:grova</code> and sign in again.
              </>
            )}
          </p>
          {import.meta.env.DEV && this.state.error && (
            <pre className="max-w-lg overflow-auto rounded bg-muted p-2 text-left text-xs text-destructive">
              {this.state.error.message}
            </pre>
          )}
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
