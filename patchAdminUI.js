const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/app/admin/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add useLanguage import
if (!content.includes("useLanguage")) {
  content = content.replace(
    "import { useAuthStore } from '@/store/useAuthStore';",
    "import { useAuthStore } from '@/store/useAuthStore';\nimport { useLanguage } from '@/context/LanguageContext';"
  );
}

// 2. Add useLanguage hook
if (!content.includes("const { t, language, setLanguage } = useLanguage();")) {
  content = content.replace(
    "export default function AdminDashboard() {",
    "export default function AdminDashboard() {\n  const { t, language, setLanguage } = useLanguage();"
  );
}

// 3. Add language toggle to header
if (!content.includes("onClick={() => setLanguage('en')}")) {
  content = content.replace(
    "            <h1 className=\"text-xl md:text-2xl font-black text-gray-900 truncate\">",
    `            <div className="flex items-center gap-4">
              <div className="bg-gray-100 p-1 rounded-lg flex items-center shadow-inner hidden md:flex">
                <button 
                  onClick={() => setLanguage('en')}
                  className={\`px-3 py-1 text-sm font-bold rounded-md transition-all \${language === 'en' ? 'bg-white text-bsg-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}
                >
                  EN
                </button>
                <button 
                  onClick={() => setLanguage('hi')}
                  className={\`px-3 py-1 text-sm font-bold rounded-md transition-all \${language === 'hi' ? 'bg-white text-bsg-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}\`}
                >
                  HI
                </button>
              </div>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-gray-900 truncate">`
  );
}

// 4. Update User interface
content = content.replace(
  "  district?: string;\n}",
  "  district?: string;\n  lastLogin?: string;\n  lastLogout?: string;\n  failedLoginAttempts?: number;\n  lockedUntil?: string;\n}"
);

// 5. Add Live Monitoring to Sidebar
if (!content.includes("href=\"/examiner/live\"")) {
  content = content.replace(
    "{/* Sidebar */}",
    `{/* Sidebar */}
      <div className={\`fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out flex flex-col \${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}\`}>
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-bsg-blue rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-bsg-blue/30">
              BSG
            </div>
            <span className="font-extrabold text-xl tracking-tight text-gray-900">{t('adminPanel') || 'Admin Panel'}</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {[
            { id: 'users', icon: Users, label: t('users') || 'Users' },
            { id: 'exams', icon: List, label: t('exams') || 'Exams' },
            { id: 'settings', icon: SettingsIcon, label: t('settings') || 'Settings' },
            { id: 'profile', icon: UserCog, label: t('profile') || 'Profile' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
              className={\`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all \${activeTab === item.id ? 'bg-bsg-blue text-white shadow-md shadow-bsg-blue/20' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}\`}
            >
              <item.icon size={20} className={activeTab === item.id ? 'text-white' : 'text-gray-400'} />
              {item.label}
            </button>
          ))}
          <div className="pt-4 mt-4 border-t border-gray-100">
            <a href="/examiner/live" className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl font-bold transition-all text-red-600 hover:bg-red-50 hover:text-red-700">
              <TrendingUp size={20} className="text-red-500" />
              {t('liveMonitoring') || 'Live Monitoring'}
            </a>
          </div>
        </div>
`
  );
  // Need to remove the old sidebar map since I just replaced the header and the map
  content = content.replace(/<div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">([\s\S]*?)<div className="p-4 border-t border-gray-100">/, '<div className="p-4 border-t border-gray-100">');
}

// 6. Remove Terms and Privacy
content = content.replace(/<div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden mb-6">[\s\S]*?<div className="p-6 border-b border-gray-100 bg-gray-50\/50">[\s\S]*?<h3 className="text-lg font-black text-gray-900">Legal Links<\/h3>[\s\S]*?<\/div>[\s\S]*?<div className="p-6 space-y-5">[\s\S]*?<label className="block text-sm font-bold text-gray-700 mb-1">Terms & Conditions URL<\/label>[\s\S]*?onChange=\{\(e\) => setSettingsForm\(\{ \.\.\.settingsForm!, termsUrl: e\.target\.value \}\)\} \/>[\s\S]*?<\/div>[\s\S]*?<div>[\s\S]*?<label className="block text-sm font-bold text-gray-700 mb-1">Privacy Policy URL<\/label>[\s\S]*?onChange=\{\(e\) => setSettingsForm\(\{ \.\.\.settingsForm!, privacyUrl: e\.target\.value \}\)\} \/>[\s\S]*?<\/div>[\s\S]*?<\/div>[\s\S]*?<\/div>/g, '');

// 7. Add Unlock logic
if (!content.includes("const handleUnlock = async")) {
  content = content.replace(
    "  const handlePasswordReset = async () => {",
    `  const handleUnlock = async (userId: string) => {
    try {
      const { data } = await axios.put(\`\${API_URL}/api/users/\${userId}/unlock\`, {}, { withCredentials: true });
      setUsers(users.map(u => u._id === userId ? { ...u, failedLoginAttempts: 0, lockedUntil: undefined } : u));
    } catch (error) {
      console.error(error);
      alert("Failed to unlock user.");
    }
  };

  const handlePasswordReset = async () => {`
  );
}

// 8. Add Filters and Table updates for Users
if (!content.includes("const [statusFilter, setStatusFilter]")) {
  content = content.replace(
    "const [sectionFilter, setSectionFilter] = useState('All');",
    "const [sectionFilter, setSectionFilter] = useState('All');\n  const [statusFilter, setStatusFilter] = useState('All');\n  const [examSearch, setExamSearch] = useState('');\n  const [examStatusFilter, setExamStatusFilter] = useState('All');"
  );
}

// Replace User Filters UI
content = content.replace(
  /<select className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-bsg-blue focus:border-bsg-blue block p-2.5 font-bold shadow-sm" value=\{roleFilter\} onChange=\{\(e\) => setRoleFilter\(e.target.value\)\}>[\s\S]*?<\/select>/,
  `<select className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-bsg-blue focus:border-bsg-blue block p-2.5 font-bold shadow-sm" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                      <option value="All">All Roles</option>
                      <option value="Candidate">Candidate</option>
                      <option value="Examiner">Examiner</option>
                      <option value="Admin">Admin</option>
                    </select>
                    <select className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-bsg-blue focus:border-bsg-blue block p-2.5 font-bold shadow-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                      <option value="All">All Status</option>
                      <option value="Locked">Locked Accounts</option>
                      <option value="Online">Online Now</option>
                    </select>`
);

// Apply User Filter logic
content = content.replace(
  "const filteredUsers = users.filter(u => {",
  `const filteredUsers = users.filter(u => {
    const isLocked = u.lockedUntil && new Date(u.lockedUntil) > new Date();
    const isOnline = u.lastLogin && (!u.lastLogout || new Date(u.lastLogin) > new Date(u.lastLogout));
    if (statusFilter === 'Locked' && !isLocked) return false;
    if (statusFilter === 'Online' && !isOnline) return false;`
);

// Update Users Table UI to show login/logout and unlock button
content = content.replace(
  /<th scope="col" className="px-6 py-4">Status<\/th>[\s\S]*?<th scope="col" className="px-6 py-4 rounded-tr-2xl text-right">Actions<\/th>/,
  `<th scope="col" className="px-6 py-4">Status</th>
                          <th scope="col" className="px-6 py-4">Activity</th>
                          <th scope="col" className="px-6 py-4 rounded-tr-2xl text-right">Actions</th>`
);

content = content.replace(
  /<td className="px-6 py-4 whitespace-nowrap">[\s\S]*?<span className=\{\`px-3 py-1 rounded-full text-xs font-extrabold \$\{user\.status === 'Active' \? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'\}\`\}>[\s\S]*?\{user\.status\}[\s\S]*?<\/span>[\s\S]*?<\/td>[\s\S]*?<td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">/,
  `<td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <span className={\`w-max px-3 py-1 rounded-full text-xs font-extrabold \${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}\`}>
                                {user.status}
                              </span>
                              {(user.lockedUntil && new Date(user.lockedUntil) > new Date()) && (
                                <span className="w-max px-3 py-1 rounded-full text-xs font-extrabold bg-orange-100 text-orange-700">Locked</span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                            <div className="flex flex-col gap-1">
                              <div><span className="font-bold text-gray-700">In:</span> {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</div>
                              <div><span className="font-bold text-gray-700">Out:</span> {user.lastLogout ? new Date(user.lastLogout).toLocaleString() : 'Never'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {(user.lockedUntil && new Date(user.lockedUntil) > new Date()) && (
                              <button onClick={() => handleUnlock(user._id)} className="text-orange-600 hover:text-orange-900 font-bold bg-orange-50 px-3 py-1.5 rounded-lg mr-2 transition-colors">
                                Unlock
                              </button>
                            )}`
);

// Apply Exam Filters
content = content.replace(
  /<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">[\s\S]*?<h2 className="text-2xl font-black text-gray-900">Platform Exams Overview<\/h2>[\s\S]*?<\/div>/,
  `<div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <h2 className="text-2xl font-black text-gray-900">Platform Exams Overview</h2>
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search size={16} className="text-gray-400" />
                      </div>
                      <input 
                        type="text" 
                        className="bg-white border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-bsg-blue focus:border-bsg-blue block w-full pl-10 p-2.5 font-medium shadow-sm transition-all" 
                        placeholder="Search exams..." 
                        value={examSearch}
                        onChange={(e) => setExamSearch(e.target.value)}
                      />
                    </div>
                    <select className="bg-white border border-gray-200 text-gray-700 text-sm rounded-xl focus:ring-bsg-blue focus:border-bsg-blue block p-2.5 font-bold shadow-sm" value={examStatusFilter} onChange={(e) => setExamStatusFilter(e.target.value)}>
                      <option value="All">All Status</option>
                      <option value="Draft">Draft</option>
                      <option value="Published">Published</option>
                      <option value="Archived">Archived</option>
                    </select>
                  </div>
                </div>`
);

// Apply Exam Filter logic
content = content.replace(
  "<tbody>\n                      {exams.map((exam) => (",
  `<tbody>
                      {exams.filter(e => {
                        const mSearch = examSearch.toLowerCase();
                        if (examSearch && !e.title.toLowerCase().includes(mSearch) && !(e.category || '').toLowerCase().includes(mSearch)) return false;
                        if (examStatusFilter !== 'All' && e.status !== examStatusFilter) return false;
                        return true;
                      }).map((exam) => (`
);


fs.writeFileSync(filePath, content, 'utf8');
console.log('Admin UI patched successfully');
