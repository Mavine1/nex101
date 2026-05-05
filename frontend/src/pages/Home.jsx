import React from 'react';
import Navbar from '../components/Navbar';
 // adjust the import path as needed

const Home = () => {
  return (
    <>
      <Navbar />
      <div className="bg-blue-500 text-white p-4">
  If this is blue, Tailwind works
</div>
    </>
  );
};

export default Home;