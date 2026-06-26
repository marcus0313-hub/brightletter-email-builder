import { Component } from "react";
import EmailBuilder from "./components/EmailBuilder.jsx";

class BuilderErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Brightletter render error", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <main className="builder-error">
          <h1>The builder could not finish loading.</h1>
          <p>{this.state.error.message}</p>
          <button onClick={() => window.location.reload()} type="button">
            Reload builder
          </button>
        </main>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <BuilderErrorBoundary>
      <EmailBuilder />
    </BuilderErrorBoundary>
  );
}
