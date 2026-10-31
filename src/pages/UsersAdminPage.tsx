import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  BookOpen,
  GraduationCap,
  Plus,
  Search,
  CheckCircle2,
  X,
  UserCheck,
  Link2,
} from 'lucide-react';
import { collection, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, sanitizeFirestoreDoc } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { UserProfile, UserRole } from '../types';
import { REAL_ADMIN_PROFILE } from '../services/dataService';

export const UsersAdminPage: React.FC = () => {
  const { activeRole } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([REAL_ADMIN_PROFILE]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Add User Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('student');

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, 'userProfiles'),
      (snap) => {
        const list: UserProfile[] = [];
        snap.forEach((d) => list.push(d.data() as UserProfile));
        if (list.length > 0) {
          setUsers(list);
        } else {
          setUsers([REAL_ADMIN_PROFILE]);
        }
        setLoading(false);
      },
      (error) => {
        console.warn('Real-time users error:', error);
        setUsers([REAL_ADMIN_PROFILE]);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const handleRoleChange = async (userId: string, updatedRole: UserRole) => {
    try {
      await setDoc(doc(db, 'userProfiles', userId), { role: updatedRole }, { merge: true });
    } catch (e) {
      console.error('Failed to update role:', e);
    }
  };

  const handleAddUser = async () => {
    if (!newEmail.trim() || !newName.trim()) return;
    try {
      const id = `user-${Date.now()}`;
      const newUser: UserProfile = {
        userId: id,
        email: newEmail.trim().toLowerCase(),
        fullName: newName.trim(),
        role: newRole,
        avatarUrl: '',
        bio: `${newRole.toUpperCase()} • Zahira College 2k28 Science EM`,
        assignedClassIds: ['class-2k28-science-em'],
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'userProfiles', id), sanitizeFirestoreDoc(newUser));
      setShowAddModal(false);
      setNewEmail('');
      setNewName('');
    } catch (e) {
      console.error('Failed to add user:', e);
    }
  };

  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesSearch =
      (u.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl font-bold tracking-tight text-stone-900">
            User Accounts & Role Administration
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Zahira College 2k28 Science EM directory, role-based access control (RBAC), and member accounts
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 px-4 py-2.5 text-xs font-bold text-stone-950 transition-all shadow-md shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Provision User Account</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'admin', 'teacher', 'student', 'parent'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`rounded-lg px-3 py-1.5 font-semibold capitalize transition-all ${
                roleFilter === role
                  ? 'bg-stone-900 text-white shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              {role === 'all' ? 'All Roles' : `${role}s`}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400" />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-stone-200 bg-stone-50 py-1.5 pl-8 pr-3 text-xs text-stone-800 focus:bg-white focus:outline-none"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-stone-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Current Role</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role Privileges</th>
                <th className="py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {filtered.map((user) => (
                <tr key={user.userId} className="hover:bg-stone-50/50 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-stone-900 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {user.fullName ? user.fullName.charAt(0) : 'U'}
                      </div>
                      <div>
                        <p className="font-bold text-stone-900">{user.fullName}</p>
                        <p className="text-[10px] text-stone-500">
                          {user.subject ? `Subject: ${user.subject}` : user.stream ? `Stream: ${user.stream}` : (user.bio || 'Zahira Academic Member')}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`rounded px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        user.role === 'admin'
                          ? 'bg-rose-100 text-rose-800'
                          : user.role === 'teacher'
                          ? 'bg-emerald-100 text-emerald-800'
                          : user.role === 'student'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-stone-600">{user.email}</td>
                  <td className="py-3.5 px-4 text-stone-500 text-[11px]">
                    {user.role === 'admin'
                      ? 'Full School Management'
                      : user.role === 'teacher'
                      ? 'Curriculum, Grading & Attendance'
                      : user.role === 'student'
                      ? 'Coursework, AI Tutor & Quizzes'
                      : 'Child Progress Access'}
                  </td>
                  <td className="py-3.5 px-4">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.userId, e.target.value as UserRole)}
                      className="rounded-lg border border-stone-200 bg-white px-2 py-1 text-xs text-stone-700 font-semibold focus:outline-none"
                    >
                      <option value="student">Set as Student</option>
                      <option value="teacher">Set as Teacher</option>
                      <option value="parent">Set as Parent</option>
                      <option value="admin">Set as Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3 mb-4">
              <h3 className="font-serif text-lg font-bold text-stone-900">Provision User Account</h3>
              <button onClick={() => setShowAddModal(false)} className="rounded-lg p-1.5 hover:bg-stone-100 text-stone-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. A. H. Mohamed"
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                  Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. mohamed@zahira.edu"
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800"
                />
              </div>

              <div>
                <label className="font-semibold text-stone-700 uppercase tracking-wider block mb-1 text-[11px]">
                  Initial Assigned Role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as any)}
                  className="w-full rounded-lg border border-stone-200 bg-stone-50 p-2 text-stone-800 font-semibold"
                >
                  <option value="student">Student Scholar</option>
                  <option value="teacher">Faculty / Teacher</option>
                  <option value="parent">Parent / Guardian</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="rounded-lg border border-stone-200 px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddUser}
                className="rounded-lg bg-stone-900 px-5 py-2 text-xs font-bold text-white hover:bg-stone-800 shadow-xs"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
