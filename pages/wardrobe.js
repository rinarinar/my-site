import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import styles from '../styles/Wardrobe.module.css';

const CATEGORIES = ['上衣', '下装', '连衣裙', '鞋子', '配饰'];
const SEASONS = ['春', '夏', '秋', '冬', '四季'];

export default function Wardrobe() {
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('manage'); // 'manage' | 'outfit'

  // Modal state
  const [showAdd, setShowAdd] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // newItem matches editingItem
  const defaultItem = { category: '上衣', season: ['四季'], image: '', price: '', link: '' };
  const [formItem, setFormItem] = useState(defaultItem);

  // Outfit state
  const [outfit, setOutfit] = useState({ top: null, bottom: null, shoes: null, accessory: null });

  useEffect(() => {
    const saved = localStorage.getItem('rina-wardrobe-items-v2');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      // Migrate old data if exists
      const oldSaved = localStorage.getItem('rina-wardrobe-items');
      if (oldSaved) {
        try {
          const old = JSON.parse(oldSaved);
          const migrated = old.map(o => ({
            ...o,
            season: Array.isArray(o.season) ? o.season : [o.season],
            price: o.price || '',
            link: o.link || ''
          }));
          setItems(migrated);
        } catch (e) {}
      }
    }
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem('rina-wardrobe-items-v2', JSON.stringify(items));
    } else {
      localStorage.removeItem('rina-wardrobe-items-v2');
    }
  }, [items]);

  // Handle image upload and compress
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        setFormItem({ ...formItem, image: dataUrl });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleLinkBlur = () => {
    const link = formItem.link.toLowerCase();
    if (!link) return;
    
    let guessedCat = formItem.category;
    if (link.includes('dress') || link.includes('裙')) guessedCat = '连衣裙';
    else if (link.includes('shoe') || link.includes('鞋')) guessedCat = '鞋子';
    else if (link.includes('pant') || link.includes('裤') || link.includes('skirt')) guessedCat = '下装';
    else if (link.includes('shirt') || link.includes('衣')) guessedCat = '上衣';
    else if (link.includes('ring') || link.includes('饰') || link.includes('hat') || link.includes('帽') || link.includes('bag') || link.includes('包')) guessedCat = '配饰';
    
    setFormItem({ ...formItem, category: guessedCat });
  };

  const toggleSeason = (s) => {
    const current = formItem.season || [];
    if (s === '四季') {
      setFormItem({ ...formItem, season: ['四季'] });
      return;
    }
    let next = current.includes(s) ? current.filter(x => x !== s) : [...current.filter(x => x !== '四季'), s];
    if (next.length === 0) next = ['四季'];
    setFormItem({ ...formItem, season: next });
  };

  const openAddModal = () => {
    setIsEditing(false);
    setFormItem(defaultItem);
    setShowAdd(true);
  };

  const openEditModal = (item) => {
    setIsEditing(true);
    setEditingId(item.id);
    setFormItem({
      category: item.category,
      season: item.season || ['四季'],
      image: item.image,
      price: item.price || '',
      link: item.link || ''
    });
    setShowAdd(true);
  };

  const handleSaveItem = () => {
    if (!formItem.image) {
      alert('请上传一张衣服的图片');
      return;
    }
    if (isEditing) {
      setItems(items.map(i => i.id === editingId ? { ...i, ...formItem } : i));
    } else {
      const item = { ...formItem, id: Date.now() };
      setItems([item, ...items]);
    }
    setShowAdd(false);
  };

  const deleteItem = () => {
    if (confirm('确定要删除这件衣物吗？')) {
      const newItems = items.filter(i => i.id !== editingId);
      setItems(newItems);
      setShowAdd(false);
    }
  };

  const generateOutfit = () => {
    const tops = items.filter(i => i.category === '上衣');
    const bottoms = items.filter(i => i.category === '下装');
    const shoes = items.filter(i => i.category === '鞋子');
    const dresses = items.filter(i => i.category === '连衣裙');
    const accessories = items.filter(i => i.category === '配饰');

    const useDress = dresses.length > 0 && (tops.length === 0 || bottoms.length === 0 || Math.random() > 0.5);

    let top = null, bottom = null;
    if (useDress) {
      top = dresses[Math.floor(Math.random() * dresses.length)];
    } else {
      if (tops.length > 0) top = tops[Math.floor(Math.random() * tops.length)];
      if (bottoms.length > 0) bottom = bottoms[Math.floor(Math.random() * bottoms.length)];
    }

    let shoe = null;
    if (shoes.length > 0) shoe = shoes[Math.floor(Math.random() * shoes.length)];

    let acc = null;
    if (accessories.length > 0 && Math.random() > 0.3) {
      acc = accessories[Math.floor(Math.random() * accessories.length)];
    }

    setOutfit({ top, bottom, shoes: shoe, accessory: acc });
  };

  const groupedItems = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = items.filter(i => i.category === cat);
    return acc;
  }, {});

  return (
    <div className={styles.container}>
      <Head>
        <title>电子衣橱 | Rina个人网站</title>
      </Head>

      <header className={styles.header}>
        <h1 className={styles.title}>👗 电子衣橱</h1>
        <p className={styles.subtitle}>管理你的穿搭与灵感</p>
      </header>

      <div className={styles.tabs}>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'manage' ? styles.active : ''}`}
          onClick={() => setActiveTab('manage')}
        >
          我的衣橱
        </button>
        <button 
          className={`${styles.tabBtn} ${activeTab === 'outfit' ? styles.active : ''}`}
          onClick={() => setActiveTab('outfit')}
        >
          穿搭生成器
        </button>
      </div>

      {activeTab === 'manage' && (
        <div className={styles.manageSection}>
          <div className={styles.toolbar}>
            <button className={styles.addBtn} onClick={openAddModal}>+ 添加衣物</button>
          </div>

          <div className={styles.categoryGroups}>
            {CATEGORIES.map(cat => {
              const catItems = groupedItems[cat];
              if (catItems.length === 0) return null;
              return (
                <div key={cat} className={styles.categoryGroup}>
                  <h3 className={styles.categoryTitle}>{cat} <span>{catItems.length}件</span></h3>
                  <div className={styles.grid}>
                    {catItems.map(item => (
                      <div key={item.id} className={styles.card} onClick={() => openEditModal(item)}>
                        <div className={styles.imgWrap}>
                          <img src={item.image} alt="Clothing" className={styles.itemImg} />
                        </div>
                        <div className={styles.cardInfo}>
                          {item.price && <div className={styles.price}>¥{item.price}</div>}
                          <div className={styles.cardTags}>
                            {(item.season || []).map(s => <span key={s} className={styles.tag}>{s}</span>)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {items.length === 0 && (
              <div className={styles.empty}>这里空空如也，快去添加衣物吧！</div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'outfit' && (
        <div className={styles.outfitSection}>
          <button className={styles.generateBtn} onClick={generateOutfit}>
            🎲 随机生成穿搭
          </button>
          
          <div className={styles.outfitDisplay}>
            {outfit.top || outfit.bottom || outfit.shoes || outfit.accessory ? (
              <div className={styles.outfitGridDisplay}>
                <div className={styles.outfitMainCol}>
                  {outfit.top && (
                    <div className={styles.outfitItem}>
                      <img src={outfit.top.image} alt="Top" />
                      <span className={styles.outfitLabel}>{outfit.top.category}</span>
                    </div>
                  )}
                  {outfit.bottom && (
                    <div className={styles.outfitItem}>
                      <img src={outfit.bottom.image} alt="Bottom" />
                      <span className={styles.outfitLabel}>{outfit.bottom.category}</span>
                    </div>
                  )}
                </div>
                <div className={styles.outfitSideCol}>
                  {outfit.accessory && (
                    <div className={styles.outfitItem}>
                      <img src={outfit.accessory.image} alt="Accessory" />
                      <span className={styles.outfitLabel}>{outfit.accessory.category}</span>
                    </div>
                  )}
                  {outfit.shoes && (
                    <div className={styles.outfitItem}>
                      <img src={outfit.shoes.image} alt="Shoes" />
                      <span className={styles.outfitLabel}>{outfit.shoes.category}</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={styles.emptyOutfit}>点击上方按钮生成今日穿搭</div>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {showAdd && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>{isEditing ? '编辑衣物' : '添加新衣物'}</h2>
            
            <div className={styles.formGroup}>
              <label>上传图片</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} />
              {formItem.image && <img src={formItem.image} className={styles.previewImg} alt="预览" />}
            </div>

            <div className={styles.formGroup}>
              <label>商品链接 (可选)</label>
              <input 
                type="text" 
                placeholder="填入链接可尝试自动推断分类" 
                value={formItem.link}
                onChange={e => setFormItem({...formItem, link: e.target.value})}
                onBlur={handleLinkBlur}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>分类</label>
                <select value={formItem.category} onChange={e => setFormItem({...formItem, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label>价格 (¥)</label>
                <input 
                  type="number" 
                  placeholder="例如: 199" 
                  value={formItem.price}
                  onChange={e => setFormItem({...formItem, price: e.target.value})}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>适用季节 (多选)</label>
              <div className={styles.seasonRow}>
                {SEASONS.map(s => {
                  const isActive = (formItem.season || []).includes(s);
                  return (
                    <button 
                      key={s}
                      type="button"
                      className={`${styles.seasonBtn} ${isActive ? styles.seasonActive : ''}`}
                      onClick={() => toggleSeason(s)}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className={styles.modalActions}>
              <div className={styles.leftAction}>
                {isEditing && (
                  <button className={styles.deleteFormBtn} onClick={deleteItem}>删除</button>
                )}
              </div>
              <div className={styles.rightActions}>
                <button className={styles.cancelBtn} onClick={() => setShowAdd(false)}>取消</button>
                <button className={styles.confirmBtn} onClick={handleSaveItem}>
                  {isEditing ? '保存修改' : '确定添加'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
