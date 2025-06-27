import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import '@fortawesome/fontawesome-free/css/all.min.css';
import "./App.css";
import EditorPage from "./pages/editor_page/editor_page";
import HomePage from './pages/home_page/home_page';
import RoomPage from './pages/room_page/room_page';
import { VideoProvider } from "./utils/video_context";
import { WebRTCProvider } from './utils/webRTC_context';
import Login from './pages/login_page/login_page';
import Signup from './pages/signup_page/signup_page';
import { MonitoringProvider } from './utils/monitoring_context';
import GlobalWarning from './components/global_warning/global_warning';

function App() {

  console.log('App component called');
  const userId = "sample-user-id";
  const roomId = "room-id-if-available";

  return (
    <Router>
      <VideoProvider>
        <WebRTCProvider>
          <MonitoringProvider userId={userId} roomId={roomId} >
            <GlobalWarning />
            <Routes>
              <Route path='/' Component={Login} />
              <Route path='/signup' Component={Signup} />
              <Route path="/home" Component={HomePage} />
              <Route path="/room/:roomId" Component={RoomPage} />
              <Route path="/code-editor/:roomId" Component={EditorPage} />
            </Routes>
          </MonitoringProvider>
        </WebRTCProvider>
      </VideoProvider>
    </Router>
  );
}


export default App;