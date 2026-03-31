import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';
import styles from '../styles/Wardrobe.module.css';

const DEFAULT_CATEGORIES = ['上衣', '下装', '连衣裙', '鞋子', '配饰', '外套'];
const SEASONS = ['春', '夏', '秋', '冬', '四季'];

export default function Wardrobe() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [savedOutfits, setSavedOutfits] = useState([]);
  
  const [activeTab, setActiveTab] = useState('manage'); // 'manage' | 'outfit' | 'saved'

  const [lastCategory, setLastCategory] = useState('上衣');
  const [lastSeason, setLastSeason] = useState(['四季']);

  // Add / Edit Modal state
  const [showAdd, setShowAdd] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [batchItems, setBatchItems] = useState([]);
  
  // Link parsing state
  const [linkInput, setLinkInput] = useState('');
  const [parsing, setParsing] = useState(false);

  // Outfit state
  const [outfit, setOutfit] = useState({ top: null, bottom: null, shoes: null, accessory: null });
  const [showPicker, setShowPicker] = useState(null); // slot key: 'top' | 'bottom' | 'shoes' | 'accessory'

  // Save Outfit Modal
  const [showSaveOutfit, setShowSaveOutfit] = useState(false);
  const [outfitSeason, setOutfitSeason] = useState('春');

  useEffect(() => {
    try {
      const savedItems = localStorage.getItem('rina-wardrobe-items-v2');
      if (savedItems) setItems(JSON.parse(savedItems));
      
      const savedCats = localStorage.getItem('rina-wardrobe-categories');
      if (savedCats) setCategories(JSON.parse(savedCats));

      const savedOuts = localStorage.getItem('rina-wardrobe-outfits');
      if (savedOuts) setSavedOutfits(JSON.parse(savedOuts));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('rina-wardrobe-items-v2', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('rina-wardrobe-categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('rina-wardrobe-outfits', JSON.stringify(savedOutfits));
  }, [savedOutfits]);

  // Handle image upload and compress (supports multiple)
  const handleImageUpload = (e, targetIndex = -1) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    files.forEach(file => {
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
          
          setBatchItems(prev => {
            if (targetIndex >= 0) {
              const next = [...prev];
              next[targetIndex].image = dataUrl;
              return next;
            }
            return [...prev, {
              id: Date.now() + Math.random(),
              image: dataUrl,
              category: lastCategory,
              season: lastSeason,
              price: '',
              link: ''
            }];
          });
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const handleParseLink = async () => {
    const link = linkInput.trim();
    if (!link) return;
    setParsing(true);
    
    let guessedCat = lastCategory;
    const lowerLink = link.toLowerCase();
    if (lowerLink.includes('dress') || lowerLink.includes('裙')) guessedCat = '连衣裙';
    else if (lowerLink.includes('shoe') || lowerLink.includes('鞋') || lowerLink.includes('boot')) guessedCat = '鞋子';
    else if (lowerLink.includes('pant') || lowerLink.includes('裤') || lowerLink.includes('skirt')) guessedCat = '下装';
    else if (lowerLink.includes('shirt') || lowerLink.includes('衣') || lowerLink.includes('top') || lowerLink.includes('jacket')) guessedCat = '上衣';
    else if (lowerLink.includes('ring') || lowerLink.includes('饰') || lowerLink.includes('hat') || lowerLink.includes('帽') || lowerLink.includes('bag') || lowerLink.includes('包')) guessedCat = '配饰';

    let img = '', price = '', season = lastSeason;

    if (link.startsWith('http')) {
      try {
        const res = await fetch(`/api/parse-link?url=${encodeURIComponent(link)}`);
        if (res.ok) {
          const data = await res.json();
          img = data.image || '';
          price = data.price || '';
          if (data.season && data.season.length > 0) season = data.season;
        }
      } catch (e) {
        console.error('Parse error', e);
      }
    }

    setBatchItems(prev => [...prev, {
      id: Date.now() + Math.random(),
      image: img,
      category: guessedCat,
      season: season,
      price,
      link
    }]);
    setLinkInput('');
    setParsing(false);
  };

  const updateBatchItem = (index, field, value) => {
    setBatchItems(prev => {
      const next = [...prev];
      next[index][field] = value;
      return next;
    });
  };

  const toggleBatchSeason = (index, s) => {
    setBatchItems(prev => {
      const next = [...prev];
      const current = next[index].season || [];
      if (s === '四季') {
        next[index].season = ['四季'];
      } else {
        let newS = current.includes(s) ? current.filter(x => x !== s) : [...current.filter(x => x !== '四季'), s];
        if (newS.length === 0) newS = ['四季'];
        next[index].season = newS;
      }
      return next;
    });
  };

  const removeBatchItem = (index) => {
    setBatchItems(prev => prev.filter((_, i) => i !== index));
  };

  const addCustomCategory = () => {
    const cat = prompt('请输入新分类名称：');
    if (cat && cat.trim() && !categories.includes(cat.trim())) {
      setCategories([...categories, cat.trim()]);
    }
  };

  const openAddModal = () => {
    setIsEditing(false);
    setBatchItems([]);
    setLinkInput('');
    setShowAdd(true);
  };

  const openEditModal = (item) => {
    setIsEditing(true);
    setBatchItems([{ ...item }]);
    setShowAdd(true);
  };

  const handleSaveItem = () => {
    const validItems = batchItems.filter(i => i.image);
    if (validItems.length === 0) {
      alert('请确保至少有一件带有图片的衣物');
      return;
    }
    
    // update memory
    const last = validItems[validItems.length - 1];
    setLastCategory(last.category);
    setLastSeason(last.season);

    if (isEditing) {
      const edited = validItems[0];
      setItems(items.map(i => i.id === edited.id ? edited : i));
    } else {
      const newItems = validItems.map(i => ({ ...i, id: i.id || Date.now() + Math.random() }));
      setItems([...newItems, ...items]);
    }
    setShowAdd(false);
  };

  const deleteItem = () => {
    if (confirm('确定要删除这件衣物吗？')) {
      const editingId = batchItems[0].id;
      setItems(items.filter(i => i.id !== editingId));
      setShowAdd(false);
    }
  };

  // Outfit Logic
  const generateOutfit = () => {
    const tops = items.filter(i => ['上衣', '外套'].includes(i.category) || !['下装', '鞋子', '配饰', '连衣裙'].includes(i.category));
    const bottoms = items.filter(i => i.category === '下装');
    const shoes = items.filter(i => i.category === '鞋子');
    const dresses = items.filter(i => i.category === '连衣裙');
    const accessories = items.filter(i => i.category === '配饰');

    const useDress = dresses.length > 0 && (tops.length === 0 || bottoms.length === 0 || Math.random() > 0.5);

    const strictSeason = Math.random() < 0.8;
    let targetSeason = '四季';

    let top = null, bottom = null;
    if (useDress) {
      top = dresses[Math.floor(Math.random() * dresses.length)];
      if (top.season && top.season[0]) targetSeason = top.season[0];
    } else {
      if (tops.length > 0) {
        top = tops[Math.floor(Math.random() * tops.length)];
        if (top.season && top.season[0]) targetSeason = top.season[0];
      }
      if (bottoms.length > 0) {
        let validBottoms = bottoms;
        if (strictSeason && targetSeason !== '四季') {
          validBottoms = bottoms.filter(i => i.season.includes(targetSeason) || i.season.includes('四季'));
          if (validBottoms.length === 0) validBottoms = bottoms;
        }
        bottom = validBottoms[Math.floor(Math.random() * validBottoms.length)];
      }
    }

    let shoe = null;
    if (shoes.length > 0) {
      let validShoes = shoes;
      if (strictSeason && targetSeason !== '四季') {
        validShoes = shoes.filter(i => i.season.includes(targetSeason) || i.season.includes('四季'));
        if (validShoes.length === 0) validShoes = shoes;
      }
      shoe = validShoes[Math.floor(Math.random() * validShoes.length)];
    }

    let acc = null;
    if (accessories.length > 0 && Math.random() > 0.3) {
      let validAcc = accessories;
      if (strictSeason && targetSeason !== '四季') {
        validAcc = accessories.filter(i => i.season.includes(targetSeason) || i.season.includes('四季'));
        if (validAcc.length === 0) validAcc = accessories;
      }
      acc = validAcc[Math.floor(Math.random() * validAcc.length)];
    }

    setOutfit({ top, bottom, shoes: shoe, accessory: acc });
  };

  const handleSaveOutfit = () => {
    if (!outfit.top && !outfit.bottom && !outfit.shoes) {
      alert('请先搭配衣服');
      return;
    }
    setShowSaveOutfit(true);
  };

  const confirmSaveOutfit = () => {
    const newOutfit = {
      id: Date.now(),
      season: outfitSeason,
      items: [outfit.top, outfit.bottom, outfit.shoes, outfit.accessory].filter(Boolean)
    };
    setSavedOutfits([newOutfit, ...savedOutfits]);
    setShowSaveOutfit(false);
    alert('保存成功！');
  };

  const deleteSavedOutfit = (id) => {
    if (confirm('确定删除这个搭配吗？')) {
      setSavedOutfits(savedOutfits.filter(o => o.id !== id));
    }
  };

  // Picker Logic
  const getPickerItems = () => {
    if (!showPicker) return [];
    if (showPicker === 'shoes') return items.filter(i => i.category === '鞋子');
    if (showPicker === 'accessory') return items.filter(i => i.category === '配饰');
    if (showPicker === 'bottom') return items.filter(i => i.category === '下装');
    // top slot: show tops, dresses, outerwear, or uncategorized
    return items.filter(i => !['下装', '鞋子', '配饰'].includes(i.category));
  };

  const groupedItems = categories.reduce((acc, cat) => {
    acc[cat] = items.filter(i => i.category === cat);
    return acc;
  }, {});
  // Add an "Other" category for deleted categories
  const otherItems = items.filter(i => !categories.includes(i.category));
  if (otherItems.length > 0) groupedItems['其它'] = otherItems;

  const groupedSavedOutfits = SEASONS.reduce((acc, s) => {
    acc[s] = savedOutfits.filter(o => o.season === s);
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
        <button 
          className={`${styles.tabBtn} ${activeTab === 'saved' ? styles.active : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          我的穿搭
        </button>
      </div>

      {activeTab === 'manage' && (
        <div className={styles.manageSection}>
          <div className={styles.toolbar}>
            <button className={styles.addBtn} onClick={openAddModal}>+ 添加衣物</button>
          </div>

          <div className={styles.categoryGroups}>
            {Object.keys(groupedItems).map(cat => {
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
          <div className={styles.outfitControls}>
            <button className={styles.generateBtn} onClick={generateOutfit}>
              🎲 随机生成穿搭
            </button>
            <button className={styles.saveOutfitBtn} onClick={handleSaveOutfit}>
              ❤️ 保存此穿搭
            </button>
          </div>
          <p className={styles.hintText}>提示：点击对应部位可手动更换衣物</p>
          
          <div className={styles.outfitDisplay}>
            <div className={styles.outfitGridDisplay}>
              <div className={styles.outfitMainCol}>
                <div className={styles.slotBox} onClick={() => setShowPicker('top')}>
                  {outfit.top ? (
                    <>
                      <img src={outfit.top.image} alt="Top" />
                      <button className={styles.clearSlotBtn} onClick={(e) => { e.stopPropagation(); setOutfit({...outfit, top: null})}}>×</button>
                    </>
                  ) : <div className={styles.slotPlaceholder}>+ 上衣/连衣裙</div>}
                </div>
                <div className={styles.slotBox} onClick={() => setShowPicker('bottom')}>
                  {outfit.bottom ? (
                    <>
                      <img src={outfit.bottom.image} alt="Bottom" />
                      <button className={styles.clearSlotBtn} onClick={(e) => { e.stopPropagation(); setOutfit({...outfit, bottom: null})}}>×</button>
                    </>
                  ) : <div className={styles.slotPlaceholder}>+ 下装</div>}
                </div>
              </div>
              <div className={styles.outfitSideCol}>
                <div className={styles.slotBox} onClick={() => setShowPicker('accessory')}>
                  {outfit.accessory ? (
                    <>
                      <img src={outfit.accessory.image} alt="Accessory" />
                      <button className={styles.clearSlotBtn} onClick={(e) => { e.stopPropagation(); setOutfit({...outfit, accessory: null})}}>×</button>
                    </>
                  ) : <div className={styles.slotPlaceholder}>+ 配饰</div>}
                </div>
                <div className={styles.slotBox} onClick={() => setShowPicker('shoes')}>
                  {outfit.shoes ? (
                    <>
                      <img src={outfit.shoes.image} alt="Shoes" />
                      <button className={styles.clearSlotBtn} onClick={(e) => { e.stopPropagation(); setOutfit({...outfit, shoes: null})}}>×</button>
                    </>
                  ) : <div className={styles.slotPlaceholder}>+ 鞋子</div>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'saved' && (
        <div className={styles.savedSection}>
          {SEASONS.map(s => {
            const seasonOutfits = groupedSavedOutfits[s];
            if (!seasonOutfits || seasonOutfits.length === 0) return null;
            return (
              <div key={s} className={styles.categoryGroup}>
                <h3 className={styles.categoryTitle}>{s}季穿搭 <span>{seasonOutfits.length}套</span></h3>
                <div className={styles.outfitList}>
                  {seasonOutfits.map(outfit => (
                    <div key={outfit.id} className={styles.savedOutfitCard}>
                      <button className={styles.deleteOutfitBtn} onClick={() => deleteSavedOutfit(outfit.id)}>×</button>
                      <div className={styles.savedOutfitImages}>
                        {outfit.items.map((item, idx) => (
                          <img key={idx} src={item.image} alt="outfit item" className={styles.savedOutfitImg} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          {savedOutfits.length === 0 && (
            <div className={styles.empty}>还没有保存的穿搭哦</div>
          )}
        </div>
      )}

      {/* Item Picker Modal */}
      {showPicker && (
        <div className={styles.modalOverlay} onClick={() => setShowPicker(null)}>
          <div className={styles.pickerModal} onClick={e => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>选择衣物</h3>
            <div className={styles.pickerGrid}>
              {getPickerItems().map(item => (
                <div key={item.id} className={styles.pickerItem} onClick={() => {
                  setOutfit({ ...outfit, [showPicker]: item });
                  setShowPicker(null);
                }}>
                  <img src={item.image} alt="" />
                </div>
              ))}
              {getPickerItems().length === 0 && <div className={styles.empty}>该分类下没有衣物</div>}
            </div>
          </div>
        </div>
      )}

      {/* Save Outfit Modal */}
      {showSaveOutfit && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3 className={styles.modalTitle}>保存穿搭</h3>
            <div className={styles.formGroup}>
              <label>选择适用季节</label>
              <select value={outfitSeason} onChange={e => setOutfitSeason(e.target.value)}>
                {SEASONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setShowSaveOutfit(false)}>取消</button>
              <button className={styles.confirmBtn} onClick={confirmSaveOutfit}>保存</button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Items Modal */}
      {showAdd && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalLarge}>
            <h2 className={styles.modalTitle}>{isEditing ? '编辑衣物' : '添加新衣物 (支持多张)'}</h2>
            
            {!isEditing && (
              <div className={styles.uploadToolbar}>
                <label className={styles.uploadLabelBtn}>
                  📸 批量上传图片
                  <input type="file" multiple accept="image/*" onChange={handleImageUpload} hidden />
                </label>
                <div className={styles.linkInputWrap}>
                  <input 
                    type="text" 
                    placeholder="或粘贴商品链接自动解析" 
                    value={linkInput}
                    onChange={e => setLinkInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleParseLink()}
                  />
                  <button onClick={handleParseLink} disabled={parsing}>
                    {parsing ? '...' : '解析'}
                  </button>
                </div>
              </div>
            )}

            <div className={styles.batchList}>
              {batchItems.map((formItem, idx) => (
                <div key={formItem.id} className={styles.batchCard}>
                  <div className={styles.batchImgWrap}>
                    {formItem.image ? (
                      <img src={formItem.image} alt="预览" />
                    ) : (
                      <label className={styles.placeholderImg}>
                        + 点击上传
                        <input type="file" accept="image/*" onChange={e => handleImageUpload(e, idx)} hidden />
                      </label>
                    )}
                    {!isEditing && <button className={styles.removeBatchBtn} onClick={() => removeBatchItem(idx)}>×</button>}
                  </div>
                  <div className={styles.batchForm}>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label>
                          分类 
                          <button className={styles.textBtn} onClick={addCustomCategory}>+新分类</button>
                        </label>
                        <select value={formItem.category} onChange={e => updateBatchItem(idx, 'category', e.target.value)}>
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div className={styles.formGroup}>
                        <label>价格 (¥)</label>
                        <input 
                          type="number" 
                          value={formItem.price}
                          onChange={e => updateBatchItem(idx, 'price', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className={styles.formGroup}>
                      <label>商品链接</label>
                      <input 
                        type="text" 
                        value={formItem.link}
                        onChange={e => updateBatchItem(idx, 'link', e.target.value)}
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>季节</label>
                      <div className={styles.seasonRow}>
                        {SEASONS.map(s => (
                          <button 
                            key={s} type="button"
                            className={`${styles.seasonBtn} ${(formItem.season || []).includes(s) ? styles.seasonActive : ''}`}
                            onClick={() => toggleBatchSeason(idx, s)}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {batchItems.length === 0 && !isEditing && (
                <div className={styles.emptyBatch}>请上传图片或解析链接开始添加</div>
              )}
            </div>

            <div className={styles.modalActions}>
              <div className={styles.leftAction}>
                {isEditing && (
                  <button className={styles.deleteFormBtn} onClick={deleteItem}>删除此衣物</button>
                )}
              </div>
              <div className={styles.rightActions}>
                <button className={styles.cancelBtn} onClick={() => setShowAdd(false)}>取消</button>
                <button className={styles.confirmBtn} onClick={handleSaveItem}>
                  {isEditing ? '保存修改' : `确定添加 (${batchItems.filter(i=>i.image).length})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
