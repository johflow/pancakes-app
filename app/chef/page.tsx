"use client";
import { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { signInWithEmailAndPassword, onAuthStateChanged, User } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, setDoc } from "firebase/firestore";

export default function ChefDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [isActive, setIsActive] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);
  
  const [pancakesRemaining, setPancakesRemaining] = useState<number>(0);
  const [localInventoryInput, setLocalInventoryInput] = useState<string>("10");
  
  const [newIngredient, setNewIngredient] = useState("");
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) loadChefData();
    });
    return () => unsubscribeAuth();
  }, []);

  const loadChefData = async () => {
    const sessionRef = doc(db, "settings", "session");
    onSnapshot(sessionRef, (docSnap) => {
      if (docSnap.exists()) {
        setIsActive(docSnap.data().isActive);
        setIngredients(docSnap.data().availableIngredients || []);
        setPancakesRemaining(docSnap.data().pancakesRemaining || 0);
        setLocalInventoryInput(String(docSnap.data().pancakesRemaining || 0));
      } else {
        setDoc(sessionRef, { isActive: false, availableIngredients: [], pancakesRemaining: 0 });
      }
    });

    onSnapshot(collection(db, "orders"), (snapshot) => {
      const allOrders = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(order => order.status !== "Completed")
        // @ts-ignore
        .sort((a, b) => a.createdAt?.toMillis() - b.createdAt?.toMillis());
      setOrders(allOrders);
    });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    signInWithEmailAndPassword(auth, email, password).catch(err => alert(err.message));
  };

  const toggleSession = async () => {
    await updateDoc(doc(db, "settings", "session"), { isActive: !isActive });
  };
  
  const updateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    const newVal = parseInt(localInventoryInput, 10);
    if (isNaN(newVal) || newVal < 0) return alert("Please enter a valid number.");
    await updateDoc(doc(db, "settings", "session"), { pancakesRemaining: newVal });
  };

  const addIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIngredient) return;
    const updated = [...ingredients, newIngredient];
    await updateDoc(doc(db, "settings", "session"), { availableIngredients: updated });
    setNewIngredient("");
  };

  const removeIngredient = async (ingToRemove: string) => {
    const updated = ingredients.filter(i => i !== ingToRemove);
    await updateDoc(doc(db, "settings", "session"), { availableIngredients: updated });
  };

  const updateOrderStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === "In Queue" ? "Cooking" : currentStatus === "Cooking" ? "Ready" : "Completed";
    await updateDoc(doc(db, "orders", id), { status: nextStatus });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="max-w-md w-full p-8 bg-white rounded-xl shadow-lg">
          <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Chef Login</h2>
          <form onSubmit={handleLogin}>
            <input type="email" className="w-full p-3 mb-4 border border-gray-400 rounded bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Email" onChange={e => setEmail(e.target.value)} />
            <input type="password" className="w-full p-3 mb-6 border border-gray-400 rounded bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Password" onChange={e => setPassword(e.target.value)} />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold p-3 rounded transition duration-200">Enter Kitchen</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 py-10 px-6 font-sans">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-gray-900">👨‍🍳 Chef Command Center</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 col-span-1 md:col-span-2">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Live Ingredients</h2>
            <form onSubmit={addIngredient} className="flex mb-4 gap-2">
              <input className="flex-1 p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="New ingredient..." value={newIngredient} onChange={e => setNewIngredient(e.target.value)} />
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 font-bold rounded-lg transition-colors">Add</button>
            </form>
            <div className="flex flex-wrap gap-2">
              {ingredients.map(ing => (
                <span key={ing} className="bg-gray-100 border border-gray-300 text-gray-800 px-3 py-1 rounded-full flex items-center gap-2 font-medium">
                  {ing} <button type="button" onClick={() => removeIngredient(ing)} className="text-red-500 hover:text-red-700 font-bold text-xl leading-none transition-colors">&times;</button>
                </span>
              ))}
              {ingredients.length === 0 && <p className="text-gray-500 text-sm">No ingredients added yet.</p>}
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center h-full">
              <h2 className="text-xl font-bold mb-4 text-gray-800">Inventory Control</h2>
              
              <form onSubmit={updateInventory} className="flex items-end gap-3 mb-6">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Batter Remaining</label>
                  <input 
                    type="number" 
                    min="0"
                    className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-lg"
                    value={localInventoryInput}
                    onChange={(e) => setLocalInventoryInput(e.target.value)}
                  />
                </div>
                <button type="submit" className="bg-gray-800 hover:bg-gray-900 text-white font-bold px-4 py-3 rounded-lg transition-colors">
                  Set
                </button>
              </form>

              <div className="text-center mb-4">
                <span className="text-sm text-gray-500 font-bold uppercase tracking-wider">Live Countdown:</span>
                <p className={`text-3xl font-black ${pancakesRemaining > 3 ? 'text-green-600' : pancakesRemaining > 0 ? 'text-orange-500 animate-pulse' : 'text-red-600'}`}>
                  {pancakesRemaining}
                </p>
              </div>
              
              <button onClick={toggleSession} className={`w-full p-4 text-white font-bold text-lg rounded-lg transition-colors shadow-sm ${isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
                {isActive ? "Stop Accepting Orders" : "Start Accepting Orders"}
              </button>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-2 border-gray-200 pb-2">Order Management</h2>
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="bg-white border border-gray-200 shadow-sm p-5 rounded-xl flex flex-col md:flex-row justify-between md:items-center gap-4">
              <div>
                <p className="font-bold text-xl text-gray-900">{order.name}</p>
                <p className="text-gray-600 font-medium">{order.ingredients?.join(", ")}</p>
                {order.contact && <p className="text-sm text-blue-600 mt-1">Contact: {order.contact}</p>}
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <span className={`font-bold px-3 py-1 rounded-lg text-sm uppercase tracking-wider ${order.status === 'In Queue' ? 'bg-gray-100 text-gray-600' : order.status === 'Cooking' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-800'}`}>
                  {order.status}
                </span>
                <button 
                  onClick={() => updateOrderStatus(order.id, order.status)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-lg font-bold transition-colors shadow-sm w-full sm:w-auto">
                  Move to {order.status === "In Queue" ? "Cooking" : order.status === "Cooking" ? "Ready" : "Complete"}
                </button>
              </div>
            </div>
          ))}
          {orders.length === 0 && <p className="text-gray-500 py-8 bg-white rounded-xl border border-gray-200 text-center shadow-sm">No active orders right now.</p>}
        </div>
      </div>
    </div>
  );
}
