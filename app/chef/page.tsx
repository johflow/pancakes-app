"use client";
import { useState, useEffect } from "react";
import { db, auth } from "../../firebase";
import { signInWithEmailAndPassword, onAuthStateChanged, User } from "firebase/auth";
import { collection, onSnapshot, doc, updateDoc, setDoc, DocumentData } from "firebase/firestore";

export default function ChefDashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const [isActive, setIsActive] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [orders, setOrders] = useState<DocumentData[]>([]);

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
      } else {
        setDoc(sessionRef, { isActive: false, availableIngredients: [] });
      }
    });

    onSnapshot(collection(db, "orders"), (snapshot) => {
      const allOrders = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
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
      <div className="max-w-md mx-auto mt-20 p-6 bg-gray-100 rounded">
        <h2 className="text-2xl font-bold mb-4">Chef Login</h2>
        <form onSubmit={handleLogin}>
          <input className="w-full p-2 mb-4 border" placeholder="Email" onChange={e => setEmail(e.target.value)} />
          <input className="w-full p-2 mb-4 border" type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
          <button className="w-full bg-blue-500 text-white p-2 rounded">Login</button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">👨‍🍳 Chef Command Center</h1>
      
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div className="bg-gray-100 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Session Control</h2>
          <button onClick={toggleSession} className={`w-full p-4 text-white font-bold rounded ${isActive ? 'bg-red-500' : 'bg-green-500'}`}>
            {isActive ? "End Session (Stop Orders)" : "Start Session (Accept Orders)"}
          </button>
        </div>

        <div className="bg-gray-100 p-6 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Live Ingredients</h2>
          <form onSubmit={addIngredient} className="flex mb-4">
            <input className="flex-1 p-2 border" placeholder="New ingredient..." value={newIngredient} onChange={e => setNewIngredient(e.target.value)} />
            <button className="bg-blue-500 text-white px-4">Add</button>
          </form>
          <div className="flex flex-wrap gap-2">
            {ingredients.map(ing => (
              <span key={ing} className="bg-white border px-3 py-1 rounded flex items-center gap-2">
                {ing} <button type="button" onClick={() => removeIngredient(ing)} className="text-red-500 font-bold text-lg leading-none">&times;</button>
              </span>
            ))}
          </div>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-4">Order Management</h2>
      <div className="space-y-4">
        {orders.map(order => (
          <div key={order.id} className="bg-white border shadow p-4 rounded flex justify-between items-center">
            <div>
              <p className="font-bold text-lg">{order.name}</p>
              <p className="text-gray-600">{order.ingredients?.join(", ")}</p>
              {order.contact && <p className="text-sm text-blue-600">Contact: {order.contact}</p>}
            </div>
            <div className="flex items-center gap-4">
              <span className="font-bold text-gray-500">{order.status}</span>
              <button 
                onClick={() => updateOrderStatus(order.id, order.status)}
                className="bg-purple-500 text-white px-4 py-2 rounded font-bold hover:bg-purple-600">
                Move to {order.status === "In Queue" ? "Cooking" : order.status === "Cooking" ? "Ready" : "Complete"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
