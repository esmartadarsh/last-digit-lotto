import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from './components/Layout/AppLayout';
import Home from './pages/Home';
import MyTickets from './pages/MyTickets';
import Balance from './pages/Balance';
import Profile from './pages/Profile';
import BuyLotteryTicket from './pages/BuyLotteryTicket';
import BuyAbcTicket from './pages/BuyAbcTicket/index';

export default function RoutesConfig() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<AppLayout />}>
                    <Route index element={<Home />} />
                    <Route path="tickets" element={<MyTickets />} />
                    <Route path="balance" element={<Balance />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="abc-ticket/:game" element={<BuyAbcTicket />} />
                    <Route path="lottery-ticket/:game" element={<BuyLotteryTicket />} />
                </Route>
            </Routes>
        </Router>
    );
}