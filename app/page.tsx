"use client";
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, onSnapshot, doc, serverTimestamp } from "firebase/firestore";

export default function Home() {
  const [sessionActive, setSessionActive] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [maxOrders, setMaxOrders] = useState<number>(10);
  const [orders, setOrders] = useState<any[]>([]);
  
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  
  const [myOrderId, setMyOrderId] = useState<string | null>(null);
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    // 1. REAL-TIME Session Listener
    const unsubSession = onSnapshot(doc(db, "settings", "session"), (docSnap) => {
      if (docSnap.exists() && docSnap.data().isActive) {
        setSessionActive(true);
        setIngredients(docSnap.data().availableIngredients || []);
        setMaxOrders(docSnap.data().maxOrders || 10);
        
        const liveIngredients = docSnap.data().availableIngredients || [];
        setSelectedIngredients(prev => prev.filter(ing => liveIngredients.includes(ing)));
      } else {
        setSessionActive(false);
      }
    });

    // 2. REAL-TIME Orders Listener
    const unsubOrders = onSnapshot(collection(db, "orders"), (snapshot) => {
      const activeOrders = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(order => order.status !== "Completed")
        // @ts-ignore
        .sort((a, b) => a.createdAt?.toMillis() - b.createdAt?.toMillis());
      setOrders(activeOrders);
    });

    // 3. Local Storage Cooldown setup
    const savedOrderId = localStorage.getItem("pancakeOrderId");
    const savedCooldown = localStorage.getItem("pancakeCooldown");
    if (savedOrderId) setMyOrderId(savedOrderId);
    if (savedCooldown) setCooldownUntil(parseInt(savedCooldown, 10));

    const interval = setInterval(() => setCurrentTime(Date.now()), 60000);

    return () => {
      unsubSession();
      unsubOrders();
      clearInterval(interval);
    };
  }, []);

  const handleToggleIngredient = (ingredient: string) => {
    setSelectedIngredients(prev => 
      prev.includes(ingredient) ? prev.filter(i => i !== ingredient) : [...prev, ingredient]
    );
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert("Need a name!");

    if (orders.length >= maxOrders) {
      return alert("Ah! The queue just filled up. Please wait for a spot to open.");
    }

    const invalidIngredients = selectedIngredients.filter(ing => !ingredients.includes(ing));
    if (invalidIngredients.length > 0) {
      return alert(`Oops! The chef just ran out of: ${invalidIngredients.join(", ")}`);
    }
    
    const docRef = await addDoc(collection(db, "orders"), {
      name,
      contact,
      ingredients: selectedIngredients,
      status: "In Queue",
      createdAt: serverTimestamp()
    });

    const cooldownTime = Date.now() + (30 * 60 * 1000);
    
    setMyOrderId(docRef.id);
    setCooldownUntil(cooldownTime);
    localStorage.setItem("pancakeOrderId", docRef.id);
    localStorage.setItem("pancakeCooldown", cooldownTime.toString());
  };

  const myActiveOrder = orders.find(o => o.id === myOrderId);
  const isOnCooldown = cooldownUntil && cooldownUntil > currentTime;
  const minutesLeft = cooldownUntil ? Math.ceil((cooldownUntil - currentTime) / 60000) : 0;
  const isQueueFull = orders.length >= maxOrders;

  if (!sessionActive) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-10">
        <div className="text-center text-3xl font-bold bg-white p-10 rounded-xl shadow-lg border border-gray-200">
          Sorry, pancakes aren't being made right now! 🥞
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans py-10 px-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-center text-gray-900">🥞 Will's Party Pancakes</h1>
        
        {myActiveOrder ? (
          <div className="bg-blue-50 border-2 border-blue-400 p-8 rounded-xl mb-10 text-center shadow-md">
            <h2 className="text-2xl font-bold text-blue-800 mb-2">🎟️ Your Pancake Ticket</h2>
            <p className="text-gray-700 mb-4">Show this to the chef if needed.</p>
            <div className="inline-block bg-white border border-blue-200 px-6 py-4 rounded-lg shadow-sm">
              <p className="text-xl font-bold text-gray-900">{myActiveOrder.name}</p>
              <p className="text-gray-600">{myActiveOrder.ingredients?.join(", ")}</p>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-500 uppercase tracking-widest">Current Status</span><br/>
                <span className={`text-xl font-black uppercase ${myActiveOrder.status === 'Ready' ? 'text-yellow-600 animate-pulse' : 'text-blue-600'}`}>
                  {myActiveOrder.status}
                </span>
              </div>
            </div>
          </div>
        ) : isOnCooldown ? (
           <div className="bg-orange-50 border border-orange-200 p-8 rounded-xl mb-10 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-orange-700 mb-2">Whoa there, hotcakes!</h2>
            <p className="text-gray-700 text-lg">You can place another order in <strong>{minutesLeft} minute{minutesLeft !== 1 ? 's' : ''}</strong>.</p>
          </div>
        ) : isQueueFull ? (
          <div className="bg-red-50 border border-red-200 p-8 rounded-xl mb-10 text-center shadow-sm">
            <h2 className="text-2xl font-bold text-red-700 mb-2">Queue is at Capacity!</h2>
            <p className="text-gray-700 text-lg">The chef is slammed. Wait for an order to complete before placing yours.</p>
            <p className="text-sm text-red-600 font-bold mt-2">({orders.length} / {maxOrders} spots filled)</p>
          </div>
        ) : (
          <form onSubmit={submitOrder} className="bg-white p-8 rounded-xl shadow-md border border-gray-200 mb-10">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Place Your Order</h2>
              <span className="text-sm font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded-full">Capacity: {orders.length}/{maxOrders}</span>
            </div>
            
            <input className="w-full p-3 mb-4 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Your Name/Nickname" value={name} onChange={e => setName(e.target.value)} required />
            <input className="w-full p-3 mb-6 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Phone Number (Just in case)" value={contact} onChange={e => setContact(e.target.value)} />
            
            <p className="mb-3 font-bold text-gray-700">Available Ingredients:</p>
            <div className="flex flex-wrap gap-2 mb-8">
              {ingredients.map(ing => (
                <button type="button" key={ing} onClick={() => handleToggleIngredient(ing)} className={`px-4 py-2 rounded-full border font-medium transition-colors ${selectedIngredients.includes(ing) ? 'bg-blue-600 text-white border-blue-600' : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'}`}>
                  {ing}
                </button>
              ))}
            </div>
            <button type="submit" className="w-full bg-green-600 text-white p-4 rounded-lg font-bold text-xl hover:bg-green-700 transition-colors shadow-sm">Order Pancake</button>
          </form>
        )}

        <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-2 border-gray-200 pb-2">Live Queue</h2>
        <div className="space-y-4">
          {orders.map((order, index) => {
            const isMe = order.id === myOrderId;
            return (
              <div key={order.id} className={`p-5 rounded-xl flex justify-between items-center transition-all ${order.status === 'Ready' ? 'bg-yellow-100 border-2 border-yellow-400 shadow-md animate-pulse' : isMe ? 'bg-blue-50 border-2 border-blue-400 shadow-md' : 'bg-white border border-gray-200 shadow-sm'}`}>
                <div>
                  <span className="font-bold text-2xl text-gray-900 mr-4">#{index + 1}</span>
                  <span className="text-xl font-semibold text-gray-800">
                    {order.name} {isMe && <span className="text-sm bg-blue-600 text-white px-2 py-1 rounded-full ml-2 align-middle">YOU</span>}
                  </span>
                  <p className="text-gray-600 text-md mt-1">{order.ingredients?.join(", ")}</p>
                </div>
                <div className={`font-bold text-lg uppercase tracking-wider px-4 py-2 rounded-lg ${order.status === 'Ready' ? 'bg-yellow-400 text-yellow-900' : isMe ? 'bg-blue-200 text-blue-900' : 'bg-gray-100 text-gray-600'}`}>
                  {order.status}
                </div>
              </div>
            );
          })}
          {orders.length === 0 && <p className="text-gray-500 text-center py-8 bg-white rounded-xl border border-gray-200 shadow-sm">The queue is currently empty!</p>}
        </div>
      </div>
    </div>
  );
}
