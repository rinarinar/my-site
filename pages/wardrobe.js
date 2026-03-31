import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import styles from '../styles/Wardrobe.module.css';

const CATEGORIES = ['上衣', '下装', '连衣裙', '鞋子', '配饰'];
const SEASONS = ['春', '夏', '秋', '冬', '四季'];

export default function Wardrobe() {
  const [items, setItems] = useState([]);
  const [activeTab, setActiveTab] = useState('manage'); // 'manage' | 'outfit'
  const [filterCat, setFilterCat] = useState('全部');

  // Modal state
  const [showAdd, setShowAdd] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: '上衣', season: '四季', image: '' });

  // Outfit state
  const [outfit, setOutfit] = useState({ top: null, bottom: null, shoes: null });

  useEffect(() => {
    const saved = localStorage.getItem('rina-wardrobe-items');
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem('rina-wardrobe-items', JSON.stringify(items));
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
        setNewItem({ ...newItem, image: dataUrl });
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleAddItem = () => {
    if (!newItem.image) {
      alert('请上传一张衣服的图片');
      return;
    }
    const item = { ...newItem, id: Date.now() };
    setItems([item, ...items]);
    setShowAdd(false);
    setNewItem({ name: '', category: '上衣', season: '四季', image: '' });
  };

  const deleteItem = (id) => {
    if (confirm('确定要删除这件衣服吗？')) {
      const newItems = items.filter(i => i.id !== id);
      setItems(newItems);
      if (newItems.length === 0) {
        localStorage.removeItem('rina-wardrobe-items');
      }
    }
  };

  const generateOutfit = () => {
    const tops = items.filter(i => i.category === '上衣');
    const bottoms = items.filter(i => i.category === '下装');
    const shoes = items.filter(i => i.category === '鞋子');
    const dresses = items.filter(i => i.category === '连衣裙');

    // 50% chance for dress vs top+bottom if dresses are available
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

    setOutfit({ top, bottom, shoes: shoe });
  };

  const filteredItems = filterCat === '全部' ? items : items.filter(i => i.category === filterCat);

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
            <div className={styles.filters}>
              {['全部', ...CATEGORIES].map(cat => (
                <button
                  key={cat}
                  className={`${styles.filterBtn} ${filterCat === cat ? styles.filterActive : ''}`}
                  onClick={() => setFilterCat(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button className={styles.addBtn} onClick={() => setShowAdd(true)}>+ 添加衣服</button>
          </div>

          <div className={styles.grid}>
            {filteredItems.map(item => (
              <div key={item.id} className={styles.card}>
                <div className={styles.imgWrap}>
                  <img src={item.image} alt={item.name} className={styles.itemImg} />
                  <button className={styles.deleteBtn} onClick={() => deleteItem(item.id)}>×</button>
                </div>
                <div className={styles.cardInfo}>
                  <div className={styles.cardName}>{item.name || '未命名'}</div>
                  <div className={styles.cardTags}>
                    <span className={styles.tag}>{item.category}</span>
                    <span className={styles.tag}>{item.season}</span>
                  </div>
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && (
              <div className={styles.empty}>这里空空如也，快去添加衣服吧！</div>
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
            {outfit.top || outfit.bottom || outfit.shoes ? (
              <div className={styles.outfitCanvas}>
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
                {outfit.shoes && (
                  <div className={styles.outfitItem}>
                    <img src={outfit.shoes.image} alt="Shoes" />
                    <span className={styles.outfitLabel}>{outfit.shoes.category}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.emptyOutfit}>点击上方按钮生成今日穿搭</div>
            )}
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAdd && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>添加新衣物</h2>
            
            <div className={styles.formGroup}>
              <label>上传图片</label>
              <input type="file" accept="image/*" onChange={handleImageUpload} />
              {newItem.image && <img src={newItem.image} className={styles.previewImg} alt="预览" />}
            </div>

            <div className={styles.formGroup}>
              <label>名称 / 描述</label>
              <input 
                type="text" 
                placeholder="例如：黑色针织衫" 
                value={newItem.name}
                onChange={e => setNewItem({...newItem, name: e.target.value})}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>分类</label>
                <select value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label>季节</label>
                <select value={newItem.season} onChange={e => setNewItem({...newItem, season: e.target.value})}>
                  {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowAdd(false)}>取消</button>
              <button className={styles.confirmBtn} onClick={handleAddItem}>确定添加</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
