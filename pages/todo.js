import { useState, useEffect, useCallback } from 'react';
import styles from '../styles/Todo.module.css';

const API = '/api/focus-sync';
const API_KEY = 'rina-default';
const DEFAULT_TAGS = ['work'];
const ALL_TAGS = ['fr', '大盘', 'work', 'personal'];

const TAG_COLORS = {
  fr: { bg: 'rgba(0,122,255,0.12)', color: '#007AFF' },
  大盘: { bg: 'rgba(175,82,222,0.12)', color: '#AF52DE' },
  work: { bg: 'rgba(88,86,214,0.12)', color: '#5856D6' },
  personal: { bg: 'rgba(255,45,85,0.12)', color: '#FF2D55' },
};

function formatDdl(ddl) {
  if (!ddl) return null;
  const now = new Date();
  const deadline = new Date(ddl);
  const diffH = Math.round((deadline - now) / 3600000);
  if (diffH < 0) {
    const overdueH = Math.abs(diffH);
    return { label: overdueH < 24 ? `逾期${overdueH}小时` : `逾期${Math.round(diffH / -24)}天`, cls: styles.overdue };
  }
  if (diffH < 1) return { label: '即将截止', cls: styles.soon };
  if (diffH < 24) return { label: `${diffH}小时后截止`, cls: styles.soon };
  const diffD = Math.round(diffH / 24);
  if (diffD === 1) return { label: '明天截止', cls: styles.soon };
  if (diffD <= 7) return { label: `${diffD}天后截止`, cls: '' };
  const m = deadline.getMonth() + 1, day = deadline.getDate();
  const h = deadline.getHours(), min = String(deadline.getMinutes()).padStart(2, '0');
  return { label: h || min ? `${m}/${day} ${h}:${min}` : `${m}/${day} 截止`, cls: '' };
}

function getTodayDateTime() {
  const d = new Date();
  d.setHours(19, 0, 0, 0);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function Todo() {
  const [tasks, setTasks] = useState([]);
  const [customTags, setCustomTags] = useState([]);
  const [tab, setTab] = useState('active');
  const [filter, setFilter] = useState('all');
  const [selectedTags, setSelectedTags] = useState(['work']);
  const [newTask, setNewTask] = useState('');
  const [newDdl, setNewDdl] = useState(getTodayDateTime());
  const [newTag, setNewTag] = useState('');
  const [showNewTagInput, setShowNewTagInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [syncError, setSyncError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editBuf, setEditBuf] = useState({ title: '', ddl: '', tags: [] });

  const allTags = [...ALL_TAGS, ...customTags.filter(t => !ALL_TAGS.includes(t))];

  const fetchTasks = useCallback(async () => {
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch(API, {
        headers: { 'x-api-key': API_KEY }
      });
      const data = await res.json();
      if (data.ok) {
        setTasks(data.tasks || []);
        setCustomTags(data.customTags || []);
        setLastSync(new Date(data.serverTime));
      } else {
        setSyncError(data.error || '加载失败');
      }
    } catch(e) {
      console.error('fetch failed', e);
      setSyncError('网络错误，请检查 /api/focus-sync');
    } finally {
      setSyncing(false);
      setLoading(false);
    }
  }, []);

  const saveTasks = useCallback(async (newTasks, newCustomTags) => {
    setSyncing(true);
    setSyncError(null);
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify({ tasks: newTasks, customTags: newCustomTags, lastModified: Date.now() })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setSyncError(data.error || `保存失败 (${res.status})`);
        return;
      }
      setLastSync(new Date());
    } catch(e) {
      console.error('save failed', e);
      setSyncError('保存时网络错误');
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const addTask = () => {
    if (!newTask.trim()) return;
    const task = {
      id: Date.now(),
      title: newTask.trim(),
      tags: [...selectedTags],
      ddl: newDdl || null,
      completed: false,
      archived: false,
      createdAt: new Date().toISOString(),
      completedAt: null
    };
    const updated = [task, ...tasks];
    setTasks(updated);
    saveTasks(updated, customTags);
    setNewTask('');
    setNewDdl(getTodayDateTime());
    setSelectedTags(['work']);
  };

  const toggleComplete = (id) => {
    const updated = tasks.map(t => t.id === id ? { ...t, completed: !t.completed, completedAt: !t.completed ? new Date().toISOString() : null } : t);
    setTasks(updated);
    saveTasks(updated, customTags);
  };

  const archiveTask = (id) => {
    const updated = tasks.map(t => t.id === id ? { ...t, archived: true, completed: true } : t);
    setTasks(updated);
    saveTasks(updated, customTags);
  };

  const deleteTask = (id) => {
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    saveTasks(updated, customTags);
  };

  const addCustomTag = () => {
    const tag = newTag.trim();
    if (!tag || customTags.includes(tag) || allTags.includes(tag)) return;
    const updated = [...customTags, tag];
    setCustomTags(updated);
    saveTasks(tasks, updated);
    setNewTag('');
    setShowNewTagInput(false);
  };

  const toggleTag = (tag) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const beginEdit = (task) => {
    let ddl = '';
    if (task.ddl) {
      const d = new Date(task.ddl);
      if (!Number.isNaN(d.getTime())) {
        const pad = (n) => String(n).padStart(2, '0');
        ddl = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      }
    }
    setEditBuf({ title: task.title, ddl, tags: [...(task.tags || [])] });
    setEditingId(task.id);
  };

  const toggleEditTag = (tag) => {
    setEditBuf((b) => ({
      ...b,
      tags: b.tags.includes(tag) ? b.tags.filter((t) => t !== tag) : [...b.tags, tag],
    }));
  };

  const saveEdit = () => {
    if (!editingId || !editBuf.title.trim()) return;
    const isoDdl = editBuf.ddl ? new Date(editBuf.ddl).toISOString() : null;
    const updated = tasks.map((t) =>
      t.id === editingId
        ? { ...t, title: editBuf.title.trim(), ddl: isoDdl, tags: [...editBuf.tags] }
        : t
    );
    setTasks(updated);
    saveTasks(updated, customTags);
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  // Filter & sort
  const filtered = tasks.filter(t => {
    if (tab === 'archive') return t.archived;
    if (tab !== 'active') return false;
    if (filter === 'overdue') {
      return t.ddl && !t.completed && new Date(t.ddl) < new Date();
    }
    if (filter !== 'all' && !t.tags?.includes(filter)) return false;
    return !t.archived;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    if (a.ddl && b.ddl) return new Date(a.ddl) - new Date(b.ddl);
    if (a.ddl) return -1;
    if (b.ddl) return 1;
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const activeTasks = tasks.filter(t => !t.archived);
  const doneTasks = activeTasks.filter(t => t.completed);
  const pct = activeTasks.length ? Math.round((doneTasks.length / activeTasks.length) * 100) : 0;

  return (
    <>
      <main className={styles.main}>
        <div className={styles.container}>

          {/* Header */}
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>📋 Focus List</h1>
              <p className={styles.subtitle}>任务管理 · 实时同步</p>
            </div>
            <div className={`${styles.syncBadge} ${syncError ? styles.syncBadgeError : ''}`} onClick={fetchTasks} title="点击刷新">
              <span className={`${styles.syncDot} ${syncing ? styles.syncing : styles.synced}`}></span>
              <span className={styles.syncText}>
                {syncError ? syncError : syncing ? '同步中' : lastSync ? `已同步 ${lastSync.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}` : '加载中'}
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className={styles.statsRow}>
            <div className={styles.statCard}>
              <div className={styles.statNum}>{activeTasks.length}</div>
              <div className={styles.statLabel}>总任务</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNum} style={{ color: '#00C97E' }}>{doneTasks.length}</div>
              <div className={styles.statLabel}>已完成</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNum} style={{ color: '#FF4D4D' }}>{activeTasks.length - doneTasks.length}</div>
              <div className={styles.statLabel}>进行中</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statNum} style={{ color: '#FF8C00' }}>{pct}%</div>
              <div className={styles.statLabel}>完成率</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: pct + '%' }}></div>
          </div>

          {/* Tabs */}
          <div className={styles.tabs}>
            {['active', 'archive'].map(t => (
              <button
                key={t}
                className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`}
                onClick={() => setTab(t)}
              >
                {t === 'active' ? '进行中' : '已归档'}
                {t === 'active' && <span className={styles.tabBadge}>{activeTasks.filter(x => !x.completed).length}</span>}
              </button>
            ))}
          </div>

          {/* Add Task */}
          {tab === 'active' && (
            <div className={styles.addCard}>
              <div className={styles.addRow}>
                <input
                  className={styles.addInput}
                  placeholder="添加新任务，按回车..."
                  value={newTask}
                  onChange={e => setNewTask(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTask()}
                />
                <button className={styles.addBtn} onClick={addTask}>+ 添加</button>
              </div>
              <div className={styles.addMeta}>
                <input
                  className={styles.ddlInput}
                  type="datetime-local"
                  value={newDdl}
                  onChange={e => setNewDdl(e.target.value)}
                />
                <div className={styles.tagRow}>
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      className={`${styles.tagChip} ${selectedTags.includes(tag) ? styles.tagSelected : ''} ${customTags.includes(tag) && !ALL_TAGS.includes(tag) ? styles.tagCustom : ''}`}
                      style={selectedTags.includes(tag) ? {
                        background: TAG_COLORS[tag]?.color || '#FF8C00',
                        color: '#fff',
                        borderColor: 'transparent'
                      } : {}}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                  {showNewTagInput ? (
                    <div className={styles.newTagRow}>
                      <input
                        className={styles.newTagInput}
                        placeholder="标签名"
                        value={newTag}
                        maxLength={8}
                        autoFocus
                        onChange={e => setNewTag(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') addCustomTag(); if (e.key === 'Escape') setShowNewTagInput(false); }}
                      />
                      <button className={styles.newTagAdd} onClick={addCustomTag}>✓</button>
                    </div>
                  ) : (
                    <button className={styles.newTagBtn} onClick={() => setShowNewTagInput(true)}>+</button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Filter Bar */}
          {tab === 'active' && (
            <div className={styles.filterRow}>
              {['all', ...allTags, 'overdue'].map(f => (
                <button
                  key={f}
                  className={`${styles.filterChip} ${filter === f ? styles.filterActive : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? '全部' : f === 'overdue' ? '⚠ 逾期' : f}
                </button>
              ))}
            </div>
          )}

          {/* Task List */}
          {loading ? (
            <div className={styles.loading}>
              <div className={styles.spinner}></div>
              <p>加载任务中...</p>
            </div>
          ) : sorted.length === 0 ? (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>{tab === 'archive' ? '📦' : '✨'}</div>
              <p>{tab === 'archive' ? '暂无归档任务' : '没有任务，去添加一个吧'}</p>
            </div>
          ) : (
            <div className={styles.taskList}>
              {tab === 'archive' && (
                <div className={styles.archiveHeader}>
                  已归档 <span className={styles.archiveCount}>{sorted.length} 项</span>
                </div>
              )}
              {sorted.map(task => {
                const ddlInfo = formatDdl(task.ddl);
                const editing = editingId === task.id;
                return (
                  <div key={task.id} className={`${styles.taskItem} ${task.completed ? styles.completed : ''}`}>
                    <div className={styles.checkbox} onClick={() => !editing && toggleComplete(task.id)}>
                      {task.completed ? '✓' : ''}
                    </div>
                    <div className={styles.taskBody}>
                      {editing ? (
                        <div className={styles.taskEdit}>
                          <input
                            className={styles.editTitleInput}
                            value={editBuf.title}
                            onChange={(e) => setEditBuf((b) => ({ ...b, title: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                          />
                          <input
                            className={styles.editDdlInput}
                            type="datetime-local"
                            value={editBuf.ddl}
                            onChange={(e) => setEditBuf((b) => ({ ...b, ddl: e.target.value }))}
                          />
                          <div className={styles.editTagRow}>
                            {allTags.map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                className={`${styles.tagChip} ${editBuf.tags.includes(tag) ? styles.tagSelected : ''}`}
                                style={editBuf.tags.includes(tag) ? {
                                  background: TAG_COLORS[tag]?.color || '#FF8C00',
                                  color: '#fff',
                                  borderColor: 'transparent'
                                } : {}}
                                onClick={() => toggleEditTag(tag)}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                          <div className={styles.editActions}>
                            <button type="button" className={styles.editSaveBtn} onClick={saveEdit}>保存</button>
                            <button type="button" className={styles.editCancelBtn} onClick={cancelEdit}>取消</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className={styles.taskTitle}>{task.title}</div>
                          <div className={styles.taskMeta}>
                            {(task.tags || []).map(tag => (
                              <span key={tag} className={styles.taskTag} style={{
                                background: TAG_COLORS[tag]?.bg || 'rgba(255,140,0,0.12)',
                                color: TAG_COLORS[tag]?.color || '#FF8C00'
                              }}>{tag}</span>
                            ))}
                            {ddlInfo && (
                              <span className={`${styles.taskDdl} ${ddlInfo.cls}`}>
                                ⏰ {ddlInfo.label}
                              </span>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    <div className={styles.taskActions}>
                      {tab === 'active' && !task.completed && !editing && (
                        <button className={styles.actionBtn} type="button" onClick={() => beginEdit(task)} title="编辑">✎</button>
                      )}
                      {tab === 'active' && !task.completed && (
                        <button className={styles.actionBtn} onClick={() => archiveTask(task.id)} title="归档">📦</button>
                      )}
                      {tab === 'archive' && (
                        <button className={styles.actionBtn} onClick={() => {
                          const updated = tasks.map(t => t.id === task.id ? { ...t, archived: false, completed: false } : t);
                          setTasks(updated);
                          saveTasks(updated, customTags);
                        }} title="恢复">↩</button>
                      )}
                      <button className={styles.actionBtn} onClick={() => deleteTask(task.id)} title="删除">✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
