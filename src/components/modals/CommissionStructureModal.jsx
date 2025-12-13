import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiChevronDown, FiMail, FiPercent, FiUser, FiX } from 'react-icons/fi';

// Commission Structure selection modal usable for approve and edit flows
// Props:
// - isOpen: boolean
// - onClose: () => void
// - request: { id, full_name, email } | any (optional, used for header context)
// - onSave?: (groupsData) => Promise<void>   // used in edit/update flow
// - onApprove?: (requestId, groupsData) => Promise<void> // optional alternative handler
// - mode?: 'approve' | 'edit'  // determines primary button label and behavior (default 'approve')
// - existingGroups?: Array<{groupId, groupName, structureId?, usdPerLot?, spreadSharePercentage?, structureName?}> (optional)
export default function CommissionStructureModal({
  isOpen,
  onClose,
  request,
  onSave,
  onApprove,
  mode = 'approve',
  existingGroups = []
}) {
  const [availableGroups, setAvailableGroups] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isGroupMenuOpen, setIsGroupMenuOpen] = useState(false);
  const groupMenuRef = useRef(null);

  // Load approval options when opened
  useEffect(() => {
    if (!isOpen) return;

    const fetchOptions = async () => {
      try {
        setLoadingOptions(true);
        const token = localStorage.getItem('adminToken');
        const response = await fetch('/api/admin/ib-requests/approval-options', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        if (!response.ok) {
          console.error('Failed to fetch approval options');
          setAvailableGroups([]);
          return;
        }
        const data = await response.json();
        const groupsWithStructures = (data?.data?.groups || []).filter(
          (g) => Array.isArray(g.commissionStructures) && g.commissionStructures.length > 0
        );
        setAvailableGroups(groupsWithStructures);

        // If editing, pre-seed with existing groups (best-effort)
        if (mode === 'edit' && Array.isArray(existingGroups) && existingGroups.length > 0) {
          const seeded = [];
          for (const g of existingGroups) {
            const found = groupsWithStructures.find(
              (ag) => String(ag.group_id) === String(g.groupId) || ag.name === g.groupName
            );
            if (!found) continue;
            // Try to resolve structure by id or name; fallback to first
            let structure = null;
            if (g.structureId) {
              structure = found.commissionStructures.find((s) => Number(s.id) === Number(g.structureId));
            }
            if (!structure && g.structureName) {
              structure = found.commissionStructures.find(
                (s) => (s.structure_name || s.structureName) === g.structureName
              );
            }
            structure = structure || found.commissionStructures[0];
            if (!structure) continue;
            seeded.push({
              groupId: found.group_id,
              groupName: found.name,
              structureId: structure.id,
              usdPerLot: (g.usdPerLot ?? structure.usd_per_lot ?? 0).toString(),
              spreadSharePercentage: (g.spreadSharePercentage ?? structure.spread_share_percentage ?? 0).toString()
            });
          }
          setSelectedGroups(seeded);
        } else {
          setSelectedGroups([]);
        }
      } catch (err) {
        console.error('Error fetching approval options:', err);
      } finally {
        setLoadingOptions(false);
        setValidationError('');
        setIsGroupMenuOpen(false);
      }
    };

    fetchOptions();
  }, [isOpen, mode, JSON.stringify(existingGroups)]);

  // Dropdown outside/escape handlers
  useEffect(() => {
    if (!isGroupMenuOpen) return;
    const handleOutside = (e) => {
      if (groupMenuRef.current && !groupMenuRef.current.contains(e.target)) {
        setIsGroupMenuOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setIsGroupMenuOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isGroupMenuOpen]);

  const handleGroupSelection = (groupId) => {
    const group = availableGroups.find((g) => g.group_id === groupId);
    if (!group) return;
    const isAlready = selectedGroups.some((sg) => sg.groupId === groupId);
    if (isAlready) return setIsGroupMenuOpen(false);

    const defaultStructure = group.commissionStructures[0];
    if (!defaultStructure) return;
    setSelectedGroups((prev) => [
      ...prev,
      {
        groupId: group.group_id,
        groupName: group.name,
        structureId: defaultStructure.id,
        usdPerLot: String(defaultStructure.usd_per_lot ?? ''),
        spreadSharePercentage: String(defaultStructure.spread_share_percentage ?? '')
      }
    ]);
    setIsGroupMenuOpen(false);
  };

  const handleRemoveGroup = (groupId) => {
    setSelectedGroups((prev) => prev.filter((sg) => sg.groupId !== groupId));
  };

  const handleStructureChange = (groupId, structureId) => {
    setSelectedGroups((prev) =>
      prev.map((sg) => {
        if (sg.groupId !== groupId) return sg;
        const group = availableGroups.find((g) => g.group_id === groupId);
        const structure = group?.commissionStructures.find((s) => Number(s.id) === Number(structureId));
        if (!structure) return { ...sg, structureId: Number(structureId) || null };
        return {
          ...sg,
          structureId: structure.id,
          usdPerLot: String(structure.usd_per_lot ?? ''),
          spreadSharePercentage: String(structure.spread_share_percentage ?? '')
        };
      })
    );
  };

  const handleCommissionChange = (groupId, field, value) => {
    setSelectedGroups((prev) =>
      prev.map((sg) => (sg.groupId === groupId ? { ...sg, [field]: value } : sg))
    );
    setValidationError('');
  };

  const primaryAction = async () => {
    if (!selectedGroups.length) {
      setValidationError('Please select at least one group.');
      return;
    }

    for (const g of selectedGroups) {
      if (!g.structureId) {
        setValidationError(`Select a commission structure for ${g.groupName}.`);
        return;
      }
      const usd = Number.parseFloat(g.usdPerLot);
      const spread = Number.parseFloat(g.spreadSharePercentage);
      if (!Number.isFinite(usd) || !Number.isFinite(spread)) {
        setValidationError(`Please provide valid numeric values for ${g.groupName}.`);
        return;
      }
      if (usd < 0 || spread < 0 || spread > 100) {
        setValidationError(
          `Values for ${g.groupName} must be non-negative, and spread share must be between 0 and 100.`
        );
        return;
      }
    }

    setLoadingAction(true);
    try {
      const groupsData = selectedGroups.map((g) => {
        const groupInfo = availableGroups.find((ag) => ag.group_id === g.groupId);
        const structure = g.structureId
          ? groupInfo?.commissionStructures.find((s) => s.id === g.structureId)
          : null;
        const structureName = structure?.structure_name || structure?.structureName || null;
        return {
          groupId: g.groupId,
          structureId: g.structureId,
          usdPerLot: Number(parseFloat(g.usdPerLot).toFixed(2)),
          spreadSharePercentage: Number(parseFloat(g.spreadSharePercentage).toFixed(2)),
          groupName: g.groupName,
          structureName: structureName || null
        };
      });

      if (typeof onSave === 'function') {
        await onSave(groupsData);
      } else if (typeof onApprove === 'function') {
        await onApprove(request?.id, groupsData);
      }
      onClose?.();
    } catch (err) {
      console.error('CommissionStructureModal action error:', err);
      setValidationError(err?.message || 'Action failed. Please try again.');
    } finally {
      setLoadingAction(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="commission-structure-modal"
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="relative w-full max-w-3xl rounded-2xl bg-white/95 backdrop-blur shadow-2xl"
          initial={{ opacity: 0, y: 48, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.97 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
        >
          <div className="flex max-h-[90vh] flex-col">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {mode === 'edit' ? 'Update Commission Structures' : 'Approve IB Request'}
                </h2>
                <p className="text-sm text-gray-500">
                  {mode === 'edit'
                    ? 'Modify assigned MT5 groups and commission structures.'
                    : 'Assign the IB to MT5 groups and configure their commission structure.'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
              >
                <FiX className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
              {/* Context (optional) */}
              {request && (
                <div className="rounded-xl bg-gray-50 p-4 shadow-inner">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Applicant</h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center text-sm">
                      <FiUser className="mr-2 h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">
                        {request.full_name || request.fullName || '-'}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <FiMail className="mr-2 h-4 w-4 text-gray-400" />
                      <span className="break-all text-gray-700">{request.email || '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Group selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">
                    MT5 Groups & Commission Structure
                  </label>
                  <div className="relative" ref={groupMenuRef}>
                    <button
                      type="button"
                      onClick={() => setIsGroupMenuOpen((prev) => !prev)}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                      disabled={loadingOptions || availableGroups.length === 0}
                    >
                      Add Group
                      <FiChevronDown className="ml-1 h-3 w-3" />
                    </button>
                    <AnimatePresence>
                      {isGroupMenuOpen && (
                        <motion.div
                          key="group-menu"
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          className="absolute right-0 z-10 mt-1 w-80 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl"
                        >
                          <div className="max-h-80 overflow-y-auto py-1 text-sm text-gray-700">
                            {availableGroups
                              .filter((g) => !selectedGroups.some((sg) => sg.groupId === g.group_id))
                              .map((g) => (
                                <button
                                  key={g.group_id}
                                  type="button"
                                  onClick={() => handleGroupSelection(g.group_id)}
                                  className="flex w-full flex-col gap-1 border-b border-gray-100 px-3 py-3 text-left hover:bg-blue-50 last:border-b-0"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="font-medium text-gray-900">{g.name}</div>
                                    <span className="text-xs text-gray-500">
                                      {g.commissionStructures.length} structure{g.commissionStructures.length !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {g.commissionStructures.map((s) => s.structure_name || s.structureName).join(', ')}
                                  </div>
                                </button>
                              ))}
                            {availableGroups.length === 0 && !loadingOptions && (
                              <div className="px-3 py-2 text-gray-500">No groups available</div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Selected groups */}
                {selectedGroups.length > 0 ? (
                  <div className="space-y-4">
                    {selectedGroups.map((g) => {
                      const groupInfo = availableGroups.find((ag) => ag.group_id === g.groupId);
                      const structures = groupInfo?.commissionStructures || [];
                      return (
                        <div key={g.groupId} className="rounded-lg border border-gray-200 p-4 bg-white shadow-sm">
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="text-sm text-gray-500">Group</div>
                              <div className="text-base font-medium text-gray-900">{g.groupName}</div>
                            </div>
                            <button
                              onClick={() => handleRemoveGroup(g.groupId)}
                              className="text-sm text-red-600 hover:text-red-700"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Commission Structure</label>
                              <select
                                value={g.structureId || ''}
                                onChange={(e) => handleStructureChange(g.groupId, e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                              >
                                <option value="" disabled>
                                  Select a structure
                                </option>
                                {structures.map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.structure_name || s.structureName || `Structure ${s.id}`}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">USD per Lot</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={g.usdPerLot}
                                onChange={(e) => handleCommissionChange(g.groupId, 'usdPerLot', e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                                <FiPercent className="h-3 w-3 text-gray-400" /> Spread Share %
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={g.spreadSharePercentage}
                                onChange={(e) => handleCommissionChange(g.groupId, 'spreadSharePercentage', e.target.value)}
                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-gray-500">
                    No groups selected. Choose a group and commission structure from the dropdown to continue.
                  </div>
                )}

                {validationError && (
                  <div className="text-sm text-red-600">{validationError}</div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={primaryAction}
                disabled={loadingAction || loadingOptions}
                className="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loadingAction
                  ? mode === 'edit' ? 'Updating...' : 'Approving...'
                  : mode === 'edit' ? 'Update Structures' : 'Approve Request'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

