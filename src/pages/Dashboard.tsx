import React from 'react';
import { useAppSelector } from '../store/hooks';
import { selectUser } from '../store/selectors';

const Dashboard: React.FC = () => {
  const user = useAppSelector(selectUser);

  const getCreatedDate = (): string => {
    if (!user) return '';
    const date = user.created_at || user.createdAt;
    if (!date) return '';
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="dashboard">
      <div className="container">
        <div className="dashboard-content">
          <div className="welcome-card">
            <h2>Welcome to your Dashboard!</h2>
            <p>You have successfully logged in to the MERN Authentication System.</p>

            <div className="user-details">
              <h3>Your Profile Information:</h3>
              <p>
                <strong>Name:</strong> {user?.name}
              </p>
              <p>
                <strong>Email:</strong> {user?.email}
              </p>
              <p>
                <strong>Member since:</strong> {getCreatedDate()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
