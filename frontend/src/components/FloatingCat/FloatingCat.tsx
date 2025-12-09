import catImage from '../../cat.png';
import './FloatingCat.css';

export const FloatingCat = () => {
  return (
    <div className="floating-cat">
      <img src={catImage} alt="Cat" />
    </div>
  );
};
