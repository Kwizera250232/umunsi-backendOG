import React from 'react';

const Sidebar: React.FC = () => {
  return (
    <aside>
      <nav>
        <ul>
          <li>
            <a href="/admin/dashboard">Dashboard</a>
          </li>
          <li>
            <a href="/admin/articles">Articles</a>
          </li>
          <li>
            <a href="/admin/users">Users</a>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;