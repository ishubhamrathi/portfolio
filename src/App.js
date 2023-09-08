import './App.css';
import About from './components/About/About';
import Home from './components/Home/Home';
import Projects from './components/Projects/Projects';
import Social from './components/Social/Social';

function App() {
  return (
    <div className="App">
      <Home/>
      <Projects/>
      <About/>
      <Social/>
    </div>
  );
}

export default App;
