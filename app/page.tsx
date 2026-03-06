"use client";
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, onSnapshot, doc, getDoc, serverTimestamp } from "firebase/firestore";

export default function Home() {
  const [sessionActive, setSessionActive] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [orderPlaced, setOrderPlaced] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      const sessionDoc = await getDoc(doc(db, "settings", "session"));
      if (sessionDoc.exists() && sessionDoc.data().isActive) {
        setSessionActive(true);
        setIngredients(sessionDoc.data().availableIngredients || []);
      }
    };
    fetchSession();

    const unsubscribe = onSnapshot(collection(db, "orders"), (snapshot) => {
      const activeOrders = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as any))
        .filter(order => order.status !== "Completed")
        // @ts-ignore
        .sort((a, b) => a.createdAt?.toMillis() - b.createdAt?.toMillis());
      setOrders(activeOrders);
    });

    return () => unsubscribe();
  }, []);

  const handleToggleIngredient = (ingredient: string) => {
    setSelectedIngredients(prev => 
      prev.includes(ingredient) ? prev.filter(i => i !== ingredient) : [...prev, ingredient]
    );
  };

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return alert("Need a name!");
    
    await addDoc(collection(db, "orders"), {
      name,
      contact,
      ingredients: selectedIngredients,
      status: "In Queue",
      createdAt: serverTimestamp()
    });
    setOrderPlaced(true);
  };

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
        
        {!orderPlaced ? (
          <form onSubmit={submitOrder} className="bg-white p-8 rounded-xl shadow-md border border-gray-200 mb-10">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Place Your Order</h2>
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
        ) : (
          <div className="bg-green-50 border border-green-200 p-8 rounded-xl mb-10 text-center shadow-sm">
            <h2 className="text-3xl font-bold text-green-700 mb-2">Order Placed!</h2>
            <p className="text-gray-700 text-lg">Keep an eye on the queue below.</p>
          </div>
        )}

        <h2 className="text-3xl font-bold mb-6 text-gray-900 border-b-2 border-gray-200 pb-2">Live Queue</h2>
        <div className="space-y-4">
          {orders.map((order, index) => (
            <div key={order.id} className={`p-5 rounded-xl flex justify-between items-center transition-all ${order.status === 'Ready' ? 'bg-yellow-100 border-2 border-yellow-400 shadow-md animate-pulse' : 'bg-white border border-gray-200 shadow-sm'}`}>
              <div>
                <span className="font-bold text-2xl text-gray-900 mr-4">#{index + 1}</span>
                <span className="text-xl font-semibold text-gray-800">{order.name}</span>
                <p className="text-gray-600 text-md mt-1">{order.ingredients?.join(", ")}</p>
              </div>
              <div className={`font-bold text-lg uppercase tracking-wider px-4 py-2 rounded-lg ${order.status === 'Ready' ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-100 text-gray-600'}`}>
                {order.status}
              </div>
            </div>
          ))}
          {orders.length === 0 && <p className="text-gray-500 text-center py-8 bg-white rounded-xl border border-gray-200">The queue is currently empty!</p>}
        </div>
      </div>
    </div>
  );
}
