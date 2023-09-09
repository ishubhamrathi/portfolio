import './App.css';
import About from './components/About/About';
import Home from './components/Home/Home';
import Projects from './components/Projects/Projects';
import Social from './components/Social/Social';
// import {Provider, useSelector, useDispatch} from 'react-redux'
// import {toggle} from './store/slice/show.slice'

function App() {
  // const dispatch = useDispatch();
  // const show = useSelector(state=>state.show)
  return (
    // <Provider store={store}>
      <div className="App">
        <Home/>
        <Projects/>
        <About/>
        <Social/>
      </div>
    // </Provider>
  );
}

export default App;
