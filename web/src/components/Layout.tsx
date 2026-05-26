import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';
import Disclaimer from './Disclaimer';

export default function Layout() {
  return (
    <div className="h-screen flex flex-col">
      <Disclaimer />
      <TopNav />
      <main className="flex-1 pt-20 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
