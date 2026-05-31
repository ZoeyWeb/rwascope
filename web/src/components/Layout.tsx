import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';
import Disclaimer from './Disclaimer';
import Footer from './Footer';

export default function Layout() {
  return (
    <div className="h-screen flex flex-col">
      <Disclaimer />
      <TopNav />
      <main id="main-scroll" className="flex-1 pt-20 overflow-auto flex flex-col">
        <div className="flex-1">
          <Outlet />
        </div>
        <Footer />
      </main>
    </div>
  );
}
