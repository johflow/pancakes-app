"use client";
import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, addDoc, onSnapshot, doc, getDoc, serverTimestamp, DocumentData } from "firebase/firestore";

export default function Home() {
  const [sessionActive, setSessionActive] = useState(false);
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [orders, setOrders] = useState<DocumentData[]>([]);
  
  // Form State
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
        // @ts-ignore - bypassing strict timestamp typing for quick build
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
    return <div className="p-10 text-center text-2xl font-bold">Sorry, pancakes aren't being made right now!</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6 font-sans">
      <h1 className="text-4xl font-bold mb-8 text-center">🥞 Will's Party Pancakes</h1>
      
      {!orderPlaced ? (
        <form onSubmit={submitOrder} className="bg-gray-100 p-6 rounded-lg mb-10">
          <h2 className="text-2xl mb-4">Place Your Order</h2>
          <input className="w-full p-2 mb-4 border rounded" placeholder="Your Name/Nickname" value={name} onChange={e => setName(e.target.value)} required />
          <input className="w-full p-2 mb-4 border rounded" placeholder="Phone Number (Just in case)" value={contact} onChange={e => setContact(e.target.value)} />
          
          <p className="mb-2 font-bold">Available Ingredients:</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {ingredients.map(ing => (
              <button type="button" key={ing} onClick={() => handleToggleIngredient(ing)} className={`px-4 py-2 rounded-full border ${selectedIngredients.includes(ing) ? 'bg-blue-500 text-white' : 'bg-white'}`}>
                {ing}
              </button>
            ))}
          </div>
          <button type="submit" className="w-full bg-green-500 text-white p-3 rounded-lg font-bold text-lg hover:bg-green-600">Order Pancake</button>
        </form>
      ) : (
        <div className="bg-green-100 p-6 rounded-lg mb-10 text-center">
          <h2 className="text-2xl font-bold text-green-700">Order Placed!</h2>
          <p>Keep an eye on the queue below.</p>
        </div>
      )}

      <h2 className="text-3xl font-bold mb-4 border-b-2 pb-2">Live Queue</h2>
      <div className="space-y-4">
        {orders.map((order, index) => (
          <div key={order.id} className={`p-4 rounded-lg flex justify-between items-center ${order.status === 'Ready' ? 'bg-yellow-300 animate-pulse border-4 border-yellow-500' : 'bg-white shadow'}`}>
            <div>
              <span className="font-bold text-xl mr-4">#{index + 1}</span>
              <span className="text-xl">{order.name}</span>
              <p className="text-gray-600 text-sm mt-1">{order.ingredients.join(", ")}</p>
            </div>
            <div className="font-bold text-lg uppercase tracking-wider">
              {order.status}
            </div>
          </div>
        ))}
        {orders.length === 0 && <p>The queue is currently empty!</p>}
      </div>
    </div>
  );
}
