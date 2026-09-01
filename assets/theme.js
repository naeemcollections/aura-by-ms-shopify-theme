(()=>{
  const $= (s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  document.addEventListener('scroll',()=>{
    const h=$('.site-header');
    if(h) h.classList.toggle('is-scrolled', window.scrollY>8);
  },{passive:true});
  const menuBtn=$('[data-menu-toggle]'), mobileNav=$('[data-mobile-nav]');
  if(menuBtn&&mobileNav) menuBtn.addEventListener('click',()=>{
    const open=mobileNav.classList.toggle('is-open');
    menuBtn.setAttribute('aria-expanded', String(open));
  });
  const searchBtn=$('[data-search-toggle]'), searchPanel=$('[data-search-panel]');
  if(searchBtn&&searchPanel) searchBtn.addEventListener('click',()=>searchPanel.classList.add('is-open'));
  const searchClose=$('[data-search-close]');
  if(searchClose&&searchPanel) searchClose.addEventListener('click',()=>searchPanel.classList.remove('is-open'));
  const drawer=$('[data-cart-drawer]'), drawerBody=$('[data-cart-body]');
  function openDrawer(){ if(!drawer) return; drawer.hidden=false; document.body.style.overflow='hidden'; refreshCart(); }
  function closeDrawer(){ if(!drawer) return; drawer.hidden=true; document.body.style.overflow=''; }
  $$('[data-cart-open]').forEach(el=>el.addEventListener('click', openDrawer));
  $$('[data-cart-close]').forEach(el=>el.addEventListener('click', closeDrawer));
  function money(cents){ const fmt=window.theme?.moneyFormat||'${{amount}}'; return fmt.replace('{{amount}}',(cents/100).toFixed(2)); }
  function updateCount(n){ $$('[data-cart-count]').forEach(el=>{ el.textContent=n; el.hidden=n<1; }); }
  async function refreshCart(){
    const cart=await fetch('/cart.js').then(r=>r.json());
    updateCount(cart.item_count);
    if(!drawerBody) return;
    const foot=$('[data-cart-foot]');
    if(!cart.items.length){ drawerBody.innerHTML='<div class="drawer-empty"><h3>Your bag is empty</h3><a class="btn" href="/collections/perfumes">Shop perfumes</a></div>'; if(foot) foot.hidden=true; return; }
    if(foot) foot.hidden=false;
    drawerBody.innerHTML=cart.items.map(item=>`<div class="cart-line"><a href="${item.url}"><img src="${item.image||''}" alt=""></a><div class="cart-line-body"><a href="${item.url}">${item.product_title}</a><p>${money(item.final_line_price)}</p><button type="button" data-qty-change="${item.key}" data-qty="0">Remove</button></div></div>`).join('');
    const sub=$('[data-cart-subtotal]'); if(sub) sub.textContent=money(cart.total_price);
  }
  async function addToCart(id, qty=1, goCheckout=false){
    const res=await fetch('/cart/add.js',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({items:[{id:Number(id),quantity:qty}]})});
    if(!res.ok){ alert('Could not add to bag.'); return; }
    if(goCheckout){ location.href='/checkout'; return; }
    openDrawer();
  }
  document.addEventListener('click', async e=>{
    const add=e.target.closest('[data-add-to-cart]');
    if(add){ e.preventDefault(); await addToCart(add.dataset.addToCart,1,false); }
    const buy=e.target.closest('[data-buy-now]');
    if(buy){ e.preventDefault(); await addToCart(buy.dataset.buyNow,1,true); }
    const qty=e.target.closest('[data-qty-change]');
    if(qty){ await fetch('/cart/change.js',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:qty.dataset.qtyChange,quantity:Number(qty.dataset.qty)})}); await refreshCart(); }
    const qv=e.target.closest('[data-quick-view]');
    if(qv){
      e.preventDefault();
      const root=$('[data-quick-root]'); if(!root) return;
      const html=await fetch('/products/'+qv.dataset.quickView+'?section_id=quick-view').then(r=>r.text());
      const parsed=new DOMParser().parseFromString(html,'text/html');
      root.querySelector('[data-quick-content]').innerHTML=(parsed.querySelector('.shopify-section')||parsed.body).innerHTML;
      root.hidden=false; document.body.style.overflow='hidden';
    }
    if(e.target.closest('[data-quick-close]')){ const root=$('[data-quick-root]'); if(root){ root.hidden=true; document.body.style.overflow=''; } }
  });
  $$('[data-swatch]').forEach(btn=>btn.addEventListener('click',()=>{
    $$('[data-swatch]').forEach(b=>b.classList.remove('is-active'));
    btn.classList.add('is-active');
    const select=$('[data-variant-select]');
    if(select){ select.value=btn.dataset.swatch; const opt=select.selectedOptions[0]; const price=$('[data-product-price]'); if(price&&opt) price.textContent=opt.dataset.price; $$('[data-add-to-cart],[data-buy-now]').forEach(b=>{ if(b.hasAttribute('data-add-to-cart')) b.dataset.addToCart=select.value; if(b.hasAttribute('data-buy-now')) b.dataset.buyNow=select.value; }); }
  }));
})();
