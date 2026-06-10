// =========================================================================
// AUTH - Sistema de autenticación simple (RBAC)
// =========================================================================

import { ROLES, PERMISSIONS } from '../constants';

// Usuarios mock (en producción esto vendría de una API/BD)
const USERS = {
  'observer@dewcore.com': {
    password: 'observer123',
    role: ROLES.OBSERVER,
    name: 'Observer User',
  },
  'auditor@dewcore.com': {
    password: 'auditor123',
    role: ROLES.AUDITOR,
    name: 'Auditor User',
  },
};

/**
 * Intenta hacer login con las credenciales proporcionadas
 * @param {string} email
 * @param {string} password
 * @returns {object|null} Usuario autenticado o null si falla
 */
export function login(email, password) {
  const user = USERS[email];
  if (!user || user.password !== password) {
    return null;
  }

  const session = {
    email,
    name: user.name,
    role: user.role,
    permissions: PERMISSIONS[user.role],
    loginTime: new Date().toISOString(),
  };

  // Guardar en localStorage (persistencia simple)
  localStorage.setItem('cma_session', JSON.stringify(session));

  return session;
}

/**
 * Cierra sesión del usuario actual
 */
export function logout() {
  localStorage.removeItem('cma_session');
}

/**
 * Obtiene la sesión actual desde localStorage
 * @returns {object|null} Sesión actual o null si no hay
 */
export function getCurrentSession() {
  const sessionStr = localStorage.getItem('cma_session');
  if (!sessionStr) return null;

  try {
    return JSON.parse(sessionStr);
  } catch (e) {
    return null;
  }
}

/**
 * Verifica si el usuario tiene un permiso específico
 * @param {string} permission - Nombre del permiso
 * @returns {boolean}
 */
export function hasPermission(permission) {
  const session = getCurrentSession();
  if (!session) return false;

  return session.permissions[permission] === true;
}

/**
 * Verifica si hay una sesión activa
 * @returns {boolean}
 */
export function isAuthenticated() {
  return getCurrentSession() !== null;
}
