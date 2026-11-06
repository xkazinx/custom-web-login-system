//import logo from './logo.svg';
import './App.css';
import Home from './views/Home';
import SignIn from './views/SignIn';
import Register from './views/Register';
import VerifyEmail from './views/VerifyEmail';
import VerifyEmailAction from './views/VerifyEmailAction';
import Dashboard from './views/Dashboard';
import Profile from './views/DashboardProfile';

import {BrowserRouter, Routes, Route} from 'react-router-dom';
//import 'bootstrap/dist/css/bootstrap.min.css';
import CssBaseline from '@mui/material/CssBaseline';
// <img src={logo} className="App-logo" alt="logo" />
import axios from 'axios';
import { common } from './common/common.mjs'
import { useRef, useState, useEffect } from 'react'
import MenuAppBar from './components/Navbar.tsx';
import Cookies from 'js-cookie';

import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

function App() {
  const [eventsData, setEventsData] = useState([]);
  const [eventsLoaded, setEventsLoaded] = useState(false);

  const [countryIdx, setCountryIdx] = useState(null);
  const [countryLoaded, setCountryLoaded] = useState(false);
  
  const [userData, setUserData] = useState(null);
  const [userLoaded, setUserLoaded] = useState(false);

  const initialized = useRef(false)

  const [sideBarOpened, setSideBarOpened] = useState(false);

  useEffect(() => {
    if(initialized.current)
      return;
    
    initialized.current = true
    axios.defaults.withCredentials = true;
    fetchData();
  }, []);
  
  const fetchData = async () => {
   // console.log("fetchData");
    let countryIdx = -1;
    let userId = -1;
    let sessionId = -1;

    const localCountryIdx = Cookies.get("countryIdx");
    
    if(localCountryIdx)
    {
      countryIdx = localCountryIdx;
    }

    const localUserId = Cookies.get("userId");
    const localSessionId = Cookies.get("sessionId");

    if(localUserId) {  
      userId = localUserId;
    }

    if(localSessionId) {
      sessionId = localSessionId;
    }

    let data =
    {
        countryIdx: countryIdx,
        sessionId: sessionId,
        userId: userId,
    };
    
    await axios.post(common.kDomain + 'entry/', data)
      .then(res => 
        {
          setUserData(res.data.user);
          setUserLoaded(true);
          onCountryLoaded(res.data.countryIdx);

          console.log("entry/");
          console.log(res.data);
          // #todo test
          if(res.data.user == null)
          {
            Cookies.remove('sessionId');
            Cookies.remove('userId');
          }
        })
      .catch(err => console.log(err));
  };

  const onCountryLoaded = async (countryIdx) => {

    setCountryIdx(countryIdx);
    setCountryLoaded(true);
    setEventsLoaded(false);

    let data =
    {
      countryIdx: countryIdx,
    };

    await axios.post(common.kDomain + 'events/', data)
      .then(res => 
        {
          setEventsData(res.data);
          setEventsLoaded(true);
        })
      .catch(err => console.log(err));
  };

  return (
    <BrowserRouter basename={process.env.PUBLIC_URL}>
      <div style={{ height: '100vh' }}>
        <CssBaseline/>
        <MenuAppBar 
          sideBarOpened={sideBarOpened} setSideBarOpened={setSideBarOpened} 
          userData={userData} setUserData={setUserData} 
          userLoaded={userLoaded} onCountryLoaded={onCountryLoaded} 
          countryLoaded={countryLoaded} countryIdx={countryIdx} 
          />
        <Routes>
            <Route path='/' element={<Home countryIdx={countryIdx} /> } />
            <Route path='/signin' element={<SignIn setUserData={setUserData} setUserLoaded={setUserLoaded} /> } />
            <Route path='/register' element={<Register setUserData={setUserData} /> } />
            <Route path='/verify_email' element={<VerifyEmail userData={userData} /> } />
            <Route path='/verify_email/action/:sessionId' element={<VerifyEmailAction userData={userData} setUserData={setUserData} /> } />
            <Route path='/dashboard' element={<Dashboard sideBarOpened={sideBarOpened} userData={userData} /> } />
            <Route path='/dashboard/profile' element={<Profile sideBarOpened={sideBarOpened} userData={userData} /> } />
        </Routes>
      </div>
      
    </BrowserRouter>
  );
}

export default App;
