import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ProfileButton from './ProfileButton-bonus';
import './Navigation.css';
import './Navigation-bonus.css'

function Navigation({ isLoaded }) {
  const currUser = useSelector(state => state.session.user);

  return (
    <div className='Navigation-Header'>
      <div>
        <NavLink to="/"><img className='LandingPageLogo' src='../images/EldenLodges-logo.png' alt='Home'></img></NavLink>
      </div>
      <div className='R-Navigation-Header'>
        <div className='Create-spot-container'>
          {currUser && (<NavLink to='/spots/new' className='create'>Create a New Spot</NavLink>
          )}
        </div>
        <div className='User'>
          {isLoaded && (
            <ProfileButton user={currUser} />
          )}
        </div>
      </div>

    </div>

  );
}

export default Navigation;
