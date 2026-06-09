import { useEffect, useState } from 'react';
import App from './App';
import { ComponentLibrary } from './library/ComponentLibrary';

function useHashRoute() {
  const [hash, setHash] = useState(() => window.location.hash);

  useEffect(() => {
    const handleHashChange = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return hash;
}

export function Root() {
  const hash = useHashRoute();
  const isLibrary = hash.startsWith('#/library');

  if (isLibrary) {
    return <ComponentLibrary />;
  }

  return <App />;
}
