import React from "react";
function Description({ setMessage }) {  
  const handleClick = () => {
    setMessage("You are in a Description!!");  
    
  };

  return (
    <div>
      <button
        onClick={handleClick}
        style={{
          padding: "10px",
          fontSize: "16px",
          border: "none", 
          background: "transparent", 
          cursor: "pointer" 
        }}
      >
        Description
      </button>
    </div>
  );
}

export default Description;
