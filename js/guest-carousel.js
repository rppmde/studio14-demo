// A manual archive carousel. No autoplay or automatic image animation.
document.querySelectorAll('[data-guest-carousel]').forEach(carousel => {
  const track=carousel.querySelector('.guest-archive-track');
  const cards=[...track.querySelectorAll('.guest-archive-card')];
  const previous=carousel.querySelector('[data-carousel-prev]');
  const next=carousel.querySelector('[data-carousel-next]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let frame;
  const update=()=>{
    previous.disabled=track.scrollLeft<=3;
    next.disabled=track.scrollLeft+track.clientWidth>=track.scrollWidth-3;
  };
  const move=direction=>{
    const width=cards[0].getBoundingClientRect().width+parseFloat(getComputedStyle(track).gap);
    const perPage=Math.max(1,Math.floor((track.clientWidth+parseFloat(getComputedStyle(track).gap)+3)/width));
    const target=Math.max(0,Math.min(cards.length-1,Math.round(track.scrollLeft/width)+direction*perPage));
    track.scrollTo({left:target*width,behavior:reduced.matches?'instant':'smooth'});
  };
  previous.addEventListener('click',()=>move(-1));next.addEventListener('click',()=>move(1));
  track.addEventListener('keydown',event=>{
    if(event.target!==track)return;
    if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();move(event.key==='ArrowRight'?1:-1);}
    if(event.key==='Home'){event.preventDefault();track.scrollTo({left:0,behavior:reduced.matches?'instant':'smooth'});}
    if(event.key==='End'){event.preventDefault();track.scrollTo({left:track.scrollWidth,behavior:reduced.matches?'instant':'smooth'});}
  });
  track.addEventListener('scroll',()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(update);},{passive:true});
  new ResizeObserver(update).observe(track);update();
});
