import "@/App.css";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Steps from "@/components/Steps";

function App() {
  return (
    <div className="page">
      <Header />
      <main className="main">
        <Hero />
        <Steps />
      </main>
      <Footer />
    </div>
  );
}

export default App;
