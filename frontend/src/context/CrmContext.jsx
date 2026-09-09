import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  INITIAL_LEADS,
  PROJECTS,
  INITIAL_UNITS,
  INITIAL_BOOKINGS,
  EMPLOYEES,
  INITIAL_ROLES,
  PERMISSION_MODULES,
  INITIAL_AUDIT_LOGS,
  LEAD_STAGES,
  UNIT_STATUS,
} from '../mock/mockData';

const CrmContext = createContext(null);

export function CrmProvider({ children }) {
  // 1. Leads State
  const [leads, setLeads] = useState(() => {
    const saved = localStorage.getItem('crm_leads');
    return saved ? JSON.parse(saved) : INITIAL_LEADS;
  });

  // 2. Units State
  const [units, setUnits] = useState(() => {
    const saved = localStorage.getItem('crm_units');
    return saved ? JSON.parse(saved) : INITIAL_UNITS;
  });

  // 3. Projects State
  const [projects, setProjects] = useState(() => {
    const saved = localStorage.getItem('crm_projects');
    return saved ? JSON.parse(saved) : PROJECTS;
  });

  // 4. Bookings State
  const [bookings, setBookings] = useState(() => {
    const saved = localStorage.getItem('crm_bookings');
    return saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
  });

  // 5. Employees / Users State
  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem('crm_employees');
    return saved ? JSON.parse(saved) : EMPLOYEES;
  });

  // 6. Roles & Permissions Master State
  const [roles, setRoles] = useState(() => {
    const saved = localStorage.getItem('crm_roles_v2');
    if (saved) return JSON.parse(saved);
    return INITIAL_ROLES;
  });

  // 7. Audit & Recent Activity Logs State
  const [auditLogs, setAuditLogs] = useState(() => {
    const saved = localStorage.getItem('crm_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  // 8. Active Authenticated User (Synced with backend JWT session)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user') || localStorage.getItem('crm_current_user');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      id: 1,
      name: 'System Administrator',
      email: 'admin@crm.com',
      role: 'ADMIN',
    };
  });

  // Persist state changes
  useEffect(() => {
    localStorage.setItem('crm_leads', JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem('crm_units', JSON.stringify(units));
  }, [units]);

  useEffect(() => {
    localStorage.setItem('crm_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('crm_bookings', JSON.stringify(bookings));
  }, [bookings]);

  useEffect(() => {
    localStorage.setItem('crm_employees', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('crm_roles_v2', JSON.stringify(roles));
  }, [roles]);

  useEffect(() => {
    localStorage.setItem('crm_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('crm_current_user', JSON.stringify(currentUser));
  }, [currentUser]);

  // Audit Logs Action
  const addAuditLog = (entry) => {
    const newLog = {
      id: `aud-${Date.now()}`,
      timestamp: new Date().toISOString(),
      actor: {
        id: currentUser.id,
        name: currentUser.name,
        role: currentUser.role,
        avatar: currentUser.avatar,
        email: currentUser.email,
      },
      action: entry.action || 'UPDATE',
      entityType: entry.entityType || 'SYSTEM',
      entityTitle: entry.entityTitle || '',
      entityId: entry.entityId || '',
      summary: entry.summary || '',
      ipAddress: '192.168.1.102',
      device: 'Chrome 128 on Windows 11',
      severity: entry.severity || 'INFO',
      details: entry.details || null,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    return newLog;
  };

  // Roles & Permissions Master Actions
  const addRole = (roleData) => {
    const newRole = {
      id: `role-${Date.now()}`,
      name: roleData.name,
      code: (roleData.code || roleData.name).toUpperCase().replace(/[^A-Z0-9]/g, '_'),
      description: roleData.description || 'Custom organizational security role',
      isSystem: false,
      userCount: 0,
      permissions: roleData.permissions || [],
    };
    setRoles((prev) => [...prev, newRole]);
    return newRole;
  };

  const updateRole = (id, updatedFields) => {
    setRoles((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updatedFields } : r))
    );
  };

  const deleteRole = (id) => {
    setRoles((prev) => prev.filter((r) => r.id !== id));
  };

  const toggleRolePermission = (roleId, permKey) => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== roleId) return r;
        const exists = r.permissions.includes(permKey);
        const updatedPerms = exists
          ? r.permissions.filter((p) => p !== permKey)
          : [...r.permissions, permKey];
        return { ...r, permissions: updatedPerms };
      })
    );
  };

  const setRoleCategoryPermissions = (roleId, permKeys, enableAll) => {
    setRoles((prev) =>
      prev.map((r) => {
        if (r.id !== roleId) return r;
        let updated = [...r.permissions];
        if (enableAll) {
          permKeys.forEach((k) => {
            if (!updated.includes(k)) updated.push(k);
          });
        } else {
          updated = updated.filter((p) => !permKeys.includes(p));
        }
        return { ...r, permissions: updated };
      })
    );
  };

  // User Management Actions
  const addUser = (userData) => {
    const newId = `emp-${Date.now()}`;
    const initials = (userData.name || 'User')
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
    const matchedRole = roles.find((r) => r.code === userData.role);

    const newUser = {
      id: newId,
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '+91 98000 00000',
      role: userData.role || 'SALES_EXECUTIVE',
      roleName: matchedRole?.name || userData.role || 'Sales Executive',
      title: userData.title || 'Property Sales Specialist',
      avatar: initials || 'U',
      status: userData.status || 'ACTIVE',
      assignedProjects: userData.assignedProjects || ['Prestige Falcon City'],
      leadsCount: 0,
      bookingsCount: 0,
      targetAchieved: '0%',
      joinedDate: new Date().toISOString().split('T')[0],
    };
    setEmployees((prev) => [...prev, newUser]);
    return newUser;
  };

  const updateUser = (id, updatedFields) => {
    setEmployees((prev) =>
      prev.map((u) => {
        if (u.id !== id) return u;
        const roleName = updatedFields.role
          ? roles.find((r) => r.code === updatedFields.role)?.name || u.roleName
          : u.roleName;
        return { ...u, ...updatedFields, roleName };
      })
    );
  };

  const deleteUser = (id) => {
    setEmployees((prev) => prev.filter((u) => u.id !== id));
  };

  const toggleUserStatus = (id) => {
    setEmployees((prev) =>
      prev.map((u) => (u.id === id ? { ...u, status: u.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : u))
    );
  };

  // Aliases for backwards compatibility
  const addEmployee = addUser;
  const updateEmployee = updateUser;
  const deleteEmployee = deleteUser;

  // Permission Check Helper for UI Components
  const hasPermission = (permKey) => {
    if (!currentUser) return false;
    const userRole = roles.find((r) => r.code === currentUser.role);
    if (!userRole) return false;
    if (userRole.code === 'SUPER_ADMIN') return true;
    return userRole.permissions?.includes(permKey);
  };

  // Lead Actions
  const addLead = (leadData) => {
    const newId = `lead-${Date.now()}`;
    const assignedEmp = employees.find((e) => e.id === leadData.assignedToId) || currentUser;

    const newLead = {
      id: newId,
      name: leadData.name,
      email: leadData.email,
      phone: leadData.phone,
      stage: leadData.stage || LEAD_STAGES.NEW,
      assignedToId: assignedEmp.id,
      assignedToName: assignedEmp.name,
      preferredProject: leadData.preferredProject || 'Prestige Falcon City',
      budget: leadData.budget || '₹80 L - ₹1.2 Cr',
      source: leadData.source || 'Direct',
      followupDate: leadData.followupDate || null,
      followupTime: leadData.followupTime || null,
      followupNote: leadData.followupNote || leadData.notes || null,
      priority: leadData.priority || 'MEDIUM',
      createdAt: new Date().toISOString(),
      notes: leadData.notes ? [{ id: `n-${Date.now()}`, text: leadData.notes, author: currentUser.name, date: new Date().toISOString() }] : [],
      activities: [
        { id: `act-${Date.now()}`, text: `Lead created and assigned to ${assignedEmp.name}`, time: 'Just now', author: currentUser.name },
      ],
    };

    setLeads((prev) => [newLead, ...prev]);
    return newLead;
  };

  const updateLead = (id, updatedFields) => {
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id !== id) return lead;

        const activities = [...(lead.activities || [])];
        if (updatedFields.stage && updatedFields.stage !== lead.stage) {
          activities.unshift({
            id: `act-${Date.now()}`,
            text: `Stage updated from ${lead.stage} to ${updatedFields.stage}`,
            time: 'Just now',
            author: currentUser.name,
          });
        }

        return {
          ...lead,
          ...updatedFields,
          activities,
        };
      })
    );
  };

  const deleteLead = (id) => {
    setLeads((prev) => prev.filter((lead) => lead.id !== id));
  };

  const updateLeadStage = (id, newStage) => {
    updateLead(id, { stage: newStage });
  };

  const addLeadNote = (leadId, noteText) => {
    if (!noteText?.trim()) return;
    const newNote = {
      id: `n-${Date.now()}`,
      text: noteText.trim(),
      author: currentUser.name,
      date: new Date().toISOString(),
    };

    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id !== leadId) return lead;
        return {
          ...lead,
          notes: [newNote, ...(lead.notes || [])],
          activities: [
            { id: `act-${Date.now()}`, text: `Added note: "${noteText.slice(0, 45)}..."`, time: 'Just now', author: currentUser.name },
            ...(lead.activities || []),
          ],
        };
      })
    );
  };

  const scheduleFollowup = (leadId, { date, time, note, priority = 'MEDIUM' }) => {
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id !== leadId) return lead;
        return {
          ...lead,
          followupDate: date,
          followupTime: time,
          followupNote: note,
          priority,
          activities: [
            { id: `act-${Date.now()}`, text: `Follow-up scheduled for ${date} at ${time}`, time: 'Just now', author: currentUser.name },
            ...(lead.activities || []),
          ],
        };
      })
    );
  };

  const completeFollowup = (leadId) => {
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.id !== leadId) return lead;
        return {
          ...lead,
          followupDate: null,
          followupTime: null,
          followupNote: null,
          activities: [
            { id: `act-${Date.now()}`, text: 'Follow-up marked as completed', time: 'Just now', author: currentUser.name },
            ...(lead.activities || []),
          ],
        };
      })
    );
  };

  // Booking Actions
  const createBooking = ({ leadId, unitId, bookingAmount }) => {
    const lead = leads.find((l) => l.id === leadId);
    const unit = units.find((u) => u.id === unitId);

    if (!unit || unit.status !== UNIT_STATUS.AVAILABLE) {
      throw new Error('This unit is no longer available for booking.');
    }

    const bookingId = `BK-${10000 + bookings.length + 1}`;
    const newBooking = {
      id: bookingId,
      customerName: lead ? lead.name : 'Direct Customer',
      leadId: leadId || null,
      projectName: unit.projectName,
      projectId: unit.projectId,
      buildingName: unit.buildingName,
      unitNumber: unit.unitNumber,
      unitType: unit.type,
      area: `${unit.area} sq ft`,
      totalPrice: unit.price,
      bookingAmount: Number(bookingAmount) || 500000,
      bookedBy: currentUser.name,
      bookedDate: new Date().toISOString().split('T')[0],
      status: 'CONFIRMED',
      paymentStatus: 'TOKEN_RECEIVED',
    };

    // 1. Mark unit as BOOKED
    setUnits((prev) =>
      prev.map((u) =>
        u.id === unitId
          ? { ...u, status: UNIT_STATUS.BOOKED, bookedBy: newBooking.customerName, bookedAmount: newBooking.bookingAmount }
          : u
      )
    );

    // 2. Add Booking record
    setBookings((prev) => [newBooking, ...prev]);

    // 3. If tied to a lead, update lead stage to BOOKED
    if (leadId) {
      updateLead(leadId, {
        stage: LEAD_STAGES.BOOKED,
        activities: [
          { id: `act-${Date.now()}`, text: `Unit ${unit.unitNumber} (${unit.projectName}) booked successfully. Booking ID: ${bookingId}`, time: 'Just now', author: currentUser.name },
          ...(lead.activities || []),
        ],
      });
    }

    return newBooking;
  };

  const updateBookingStatus = (bookingId, newStatus, newPaymentStatus) => {
    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== bookingId) return b;
        return {
          ...b,
          status: newStatus || b.status,
          paymentStatus: newPaymentStatus || b.paymentStatus,
        };
      })
    );
  };

  const cancelBooking = (bookingId, reason) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    // Mark booking as CANCELLED
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELLED', cancellationReason: reason || 'Customer requested' } : b))
    );

    // Release unit back to AVAILABLE
    setUnits((prev) =>
      prev.map((u) => {
        if (u.unitNumber === booking.unitNumber && u.projectName === booking.projectName) {
          return { ...u, status: UNIT_STATUS.AVAILABLE, bookedBy: null, bookedAmount: null };
        }
        return u;
      })
    );
  };

  // Project / Property Master Actions
  const addProject = (projectData) => {
    const newId = `proj-${Date.now()}`;
    const towers = projectData.buildings?.length
      ? projectData.buildings
      : [
          { id: `bld-${Date.now()}-1`, name: 'Tower A', floors: 18, totalUnits: 15, availableUnits: 15, bookedUnits: 0 },
          { id: `bld-${Date.now()}-2`, name: 'Tower B', floors: 18, totalUnits: 15, availableUnits: 15, bookedUnits: 0 },
        ];

    const newProject = {
      id: newId,
      name: projectData.name,
      location: projectData.location || `${projectData.city || 'Bengaluru'}, Prime Sector`,
      city: projectData.city || 'Bengaluru',
      description: projectData.description || 'Master-planned residential development featuring premium amenities and landscaped greens.',
      totalBuildings: towers.length,
      totalUnits: projectData.totalUnits || 30,
      availableUnits: projectData.totalUnits || 30,
      bookedUnits: 0,
      priceRange: projectData.priceRange || '₹90 L - ₹2.2 Cr',
      startingPrice: projectData.startingPrice || '₹90 L',
      status: 'ACTIVE',
      possessionDate: projectData.possessionDate || 'Dec 2027',
      coverImage:
        projectData.coverImage ||
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=800&q=80',
      buildings: towers,
    };

    setProjects((prev) => [newProject, ...prev]);

    // Automatically generate initial catalog units for this new project
    const sampleUnits = [
      {
        id: `u-${Date.now()}-1`,
        unitNumber: 'A-201',
        projectId: newId,
        projectName: newProject.name,
        buildingId: towers[0].id,
        buildingName: towers[0].name,
        type: '2 BHK Luxury',
        floor: 2,
        area: 1280,
        price: 9500000,
        facing: 'East',
        status: UNIT_STATUS.AVAILABLE,
      },
      {
        id: `u-${Date.now()}-2`,
        unitNumber: 'A-504',
        projectId: newId,
        projectName: newProject.name,
        buildingId: towers[0].id,
        buildingName: towers[0].name,
        type: '3 BHK Grand',
        floor: 5,
        area: 1750,
        price: 14500000,
        facing: 'North',
        status: UNIT_STATUS.AVAILABLE,
      },
      {
        id: `u-${Date.now()}-3`,
        unitNumber: 'B-802',
        projectId: newId,
        projectName: newProject.name,
        buildingId: towers[1]?.id || towers[0].id,
        buildingName: towers[1]?.name || towers[0].name,
        type: '3 BHK Grand',
        floor: 8,
        area: 1820,
        price: 15200000,
        facing: 'East',
        status: UNIT_STATUS.AVAILABLE,
      },
      {
        id: `u-${Date.now()}-4`,
        unitNumber: 'B-1401',
        projectId: newId,
        projectName: newProject.name,
        buildingId: towers[1]?.id || towers[0].id,
        buildingName: towers[1]?.name || towers[0].name,
        type: '4 BHK Signature',
        floor: 14,
        area: 2650,
        price: 23500000,
        facing: 'North-East',
        status: UNIT_STATUS.AVAILABLE,
      },
    ];

    setUnits((prev) => [...sampleUnits, ...prev]);
    return newProject;
  };

  const deleteProject = (projectId) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    setUnits((prev) => prev.filter((u) => u.projectId !== projectId));
  };

  const updateProject = (projectId, updatedFields) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, ...updatedFields } : p))
    );

    // If project name was changed, sync unit records
    if (updatedFields.name) {
      setUnits((prev) =>
        prev.map((u) => (u.projectId === projectId ? { ...u, projectName: updatedFields.name } : u))
      );
    }
  };

  // Unit Inventory Actions
  const addUnit = (unitData) => {
    const newId = `u-${Date.now()}`;
    const targetProject = projects.find(
      (p) => p.id === unitData.projectId || p.name === unitData.projectName
    );
    const projectName = targetProject?.name || unitData.projectName || 'Prestige Falcon City';
    const projectId = targetProject?.id || unitData.projectId || 'proj-1';

    const newUnit = {
      id: newId,
      unitNumber: unitData.unitNumber,
      projectId: projectId,
      projectName: projectName,
      buildingId: unitData.buildingId || targetProject?.buildings?.[0]?.id || 'bld-1',
      buildingName: unitData.buildingName || targetProject?.buildings?.[0]?.name || 'Tower A',
      type: unitData.type || '3 BHK Grand',
      floor: parseInt(unitData.floor, 10) || 1,
      area: parseInt(unitData.area, 10) || 1650,
      price: parseInt(unitData.price, 10) || 12500000,
      facing: unitData.facing || 'East',
      status: unitData.status || UNIT_STATUS.AVAILABLE,
    };

    setUnits((prev) => [newUnit, ...prev]);

    // Update project stats
    if (targetProject) {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id !== projectId) return p;
          return {
            ...p,
            totalUnits: (p.totalUnits || 0) + 1,
            availableUnits:
              newUnit.status === UNIT_STATUS.AVAILABLE ? (p.availableUnits || 0) + 1 : p.availableUnits,
          };
        })
      );
    }

    return newUnit;
  };

  const updateUnit = (unitId, updatedFields) => {
    setUnits((prev) =>
      prev.map((u) => (u.id === unitId ? { ...u, ...updatedFields } : u))
    );
  };

  const deleteUnit = (unitId) => {
    setUnits((prev) => prev.filter((u) => u.id !== unitId));
  };

  // Reset to initial mock dataset
  const resetToMockData = () => {
    localStorage.removeItem('crm_projects');
    localStorage.removeItem('crm_leads');
    localStorage.removeItem('crm_units');
    localStorage.removeItem('crm_bookings');
    localStorage.removeItem('crm_employees');
    localStorage.removeItem('crm_roles');
    localStorage.removeItem('crm_current_user');
    setProjects(PROJECTS);
    setLeads(INITIAL_LEADS);
    setUnits(INITIAL_UNITS);
    setBookings(INITIAL_BOOKINGS);
    setEmployees(EMPLOYEES);
    setRoles(INITIAL_ROLES);
    setCurrentUser(EMPLOYEES[3] || EMPLOYEES[0]);
  };

  return (
    <CrmContext.Provider
      value={{
        leads,
        projects,
        setProjects,
        units,
        setUnits,
        bookings,
        employees,
        users: employees,
        roles,
        auditLogs,
        addAuditLog,
        permissionModules: PERMISSION_MODULES,
        currentUser,
        setCurrentUser,
        addLead,
        updateLead,
        deleteLead,
        updateLeadStage,
        addLeadNote,
        scheduleFollowup,
        completeFollowup,
        createBooking,
        updateBookingStatus,
        cancelBooking,
        addProject,
        updateProject,
        deleteProject,
        addUnit,
        updateUnit,
        deleteUnit,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        addEmployee,
        updateEmployee,
        deleteEmployee,
        addRole,
        updateRole,
        deleteRole,
        toggleRolePermission,
        setRoleCategoryPermissions,
        hasPermission,
        resetToMockData,
      }}
    >
      {children}
    </CrmContext.Provider>
  );
}

export function useCrm() {
  const context = useContext(CrmContext);
  if (!context) {
    throw new Error('useCrm must be used within a CrmProvider');
  }
  return context;
}
