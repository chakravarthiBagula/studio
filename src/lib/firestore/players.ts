import { collection, query, where, getDocs, addDoc, doc, getDoc, Firestore } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Adjust the path if necessary
import type { Player } from '@/types/kabaddi'; // Adjust the path if necessary

// Assuming Player type has at least id and name
export interface MinimalPlayer { // Export MinimalPlayer
  id: string;
  name: string;
  // Include other relevant fields if needed for search results
  phoneNumber?: string; // Include phoneNumber in MinimalPlayer
}

/**
 * Searches for players by name in the Firestore 'players' collection.
 * @param name The name to search for.
 * @returns A promise that resolves with an array of minimal player objects.
 */
export const searchPlayerByName = async (name: string): Promise<MinimalPlayer[]> => {
  const playersCollection = collection(db, 'players');
  // Create a query to find documents where the 'name' field is equal to the provided name
  const q = query(playersCollection, where('name', '==', name));

  try {
    const querySnapshot = await getDocs(q);
    const players: MinimalPlayer[] = [];
    querySnapshot.forEach((doc) => {
      // Assuming player documents have 'name' and you want to return their ID and name
      const data = doc.data() as { name: string; phoneNumber?: string }; // Cast data to include phoneNumber
      players.push({ id: doc.id, name: data.name });
    });
    return players;
  } catch (error) {
    console.error('Error searching for player by name:', error);
    return []; // Return empty array on error
  }
};

/**
 * Searches for players by phone number in the Firestore 'players' collection.
 * @param phoneNumber The phone number to search for.
 * @returns A promise that resolves with an array of minimal player objects.
 */
export const searchPlayerByPhoneNumber = async (phoneNumber: string): Promise<MinimalPlayer[]> => {
  const playersCollection = collection(db, 'players');
  // Create a query to find documents where the 'phoneNumber' field is equal to the provided phone number
  const q = query(playersCollection, where('phoneNumber', '==', phoneNumber));

  try {
    const querySnapshot = await getDocs(q);
    const players: MinimalPlayer[] = [];
    querySnapshot.forEach((doc) => {
      // Assuming player documents have 'name' and 'phoneNumber' and you want to return their ID, name, and phoneNumber
      const data = doc.data() as { name: string; phoneNumber?: string }; // Cast data
      players.push({ id: doc.id, name: data.name, phoneNumber: data.phoneNumber });
    });
    return players;
  } catch (error) {
    console.error('Error searching for player by phone number:', error);
    return []; // Return empty array on error
  }
};

/**
 * Adds a new player document to the Firestore 'players' collection.
 * @param playerData The data for the new player (at least name).
 * @returns A promise that resolves with the ID of the newly created document.
 */
export const addPlayer = async (playerData: { name: string; phoneNumber?: string }): Promise<string> => {
  const playersCollection = collection(db, 'players');
  try {
    // Prepare data to be added, including phoneNumber if provided
    const dataToAdd: { name: string; phoneNumber?: string } = {
      name: playerData.name,
    };
    if (playerData.phoneNumber) {
      dataToAdd.phoneNumber = playerData.phoneNumber;
    }
    const docRef = await addDoc(playersCollection, dataToAdd);
    return docRef.id;
  } catch (error) {
    console.error('Error adding new player:', error);
    throw error; // Re-throw error to be handled by the caller
  }
};

/**
 * Retrieves a player document from Firestore by their ID.
 * @param playerId The ID of the player document.
 * @returns A promise that resolves with the player data if found, otherwise null.
 */
export const getPlayerById = async (playerId: string): Promise<Player | null> => {
  const playerDocRef = doc(db, 'players', playerId);
  try {
    const docSnap = await getDoc(playerDocRef);
    if (docSnap.exists()) {
      // Assuming the data structure in Firestore matches the Player type (except for ID)
      // You might need to adjust this mapping based on your actual Firestore document structure
      return {
        id: docSnap.id,
        ...docSnap.data() as Omit<Player, 'id'>,
        // Ensure default values for any missing fields in Firestore if necessary
        status: (docSnap.data() as any).status || 'active',
        outOrder: (docSnap.data() as any).outOrder || null,
        stats: (docSnap.data() as any).stats || { raidPoints: 0, tacklePoints: 0, totalRaids: 0, successfulRaids: 0, unsuccessfulRaids: 0, emptyRaids: 0, superRaids: 0, superTackles: 0 },
      };
    } else {
      console.log('No such player document!');
      return null;
    }
  } catch (error) {
    console.error('Error getting player by ID:', error);
    return null; // Return null on error
  }
};