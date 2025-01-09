import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import jwtDecode from "jwt-decode";
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore'
import { db, storage } from '../../firebase'
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
// const BASE_URL =
  // "https://4e5a7f08-7622-4e75-b560-957c5bd89906-00-19z6374rnum63.sisko.repl.co";

// Async thunk for fetching a user's posts
export const fetchPostsByUser = createAsyncThunk(
  "posts/fetchByUser",
  async (userId) => {
    try {
      const postRef = collection(db, `users/${userId}/posts`);

      const querySnapshot = await getDocs(postRef);
      const docs = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      return docs;
    } catch (error) {
      console.error(error)
      throw error
    }

    // const response = await fetch(`${BASE_URL}/posts/user/${userId}`);
    // return response.json();
  }
);

export const savePost = createAsyncThunk(
  "posts/savePost",
  async ({userId, postContent, file}) => {
    try {
      console.log('Saving post...')
      let imgUrl = ""
      if(file !== null) {
        const imageRef = ref(storage, `posts/${file.name}`)
        const response = await uploadBytes(imageRef, file)
        const imageUrl = await getDownloadURL(response.ref)
      }
      const postsRef = collection(db, `users/${userId}/posts`)
      const newPostRef = doc(postsRef)
      await setDoc(newPostRef, {content: postContent, likes: [], imageUrl})
      const newPost = await getDoc(newPostRef);

      const post = {
        id: newPost.id,
        ...newPost.data()
      }

      return post;
    } catch (error){
      console.error(error)
      throw error;
    }

    // const token = localStorage.getItem("authToken");
    // const decode = jwtDecode(token);
    // const userId = decode.id;

    // const data = {
    //   title: "Post Title",
    //   content: postContent,
    //   user_id: userId,
    // };

    // const response = await axios.post(`${BASE_URL}/posts`, data);
    // return response.data;
  }
);

export const likePost = createAsyncThunk(
  'posts/likePost',
  async({userId, postId}) => {
    try {
      const postRef = doc(db, `users/${userId}/posts/${postRef}`)
      const docSnap = await getDoc(postRef);

      if(docSnap.exists()){
        const postData = docSnap.data()
        const likes = [...postData.likes, userId];
        await setDoc(postRed, {...postData, likes})
      }
      return {userId, postId}
    } catch (error) {
      console.error(error)
      throw error
    }
  }
)

export const removeLikeFromPost = createAsyncThunk(
  'posts/removeLikeFromPost',
  async({userId, postId}) => {
    try {
      const postRef = doc(db, `users/${userId}/posts/${postId}`)
      const docSnap = await getDoc(postRef);

      if(docSnap.exists()){
        const postData = docSnap.data()
        const likes = postData.likes.filter((id) => id !== userId) //[...postData.likes, userId];
        await setDoc(postRed, {...postData, likes})
      }
      return {userId, postId}
    } catch (error) {
      console.error(error)
      throw error
    }
  }
)

// Slice
const postsSlice = createSlice({
  name: "posts",
  initialState: { posts: [], loading: true },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchPostsByUser.fulfilled, (state, action) => {
      state.posts = action.payload;
      state.loading = false;
    }),
      builder.addCase(savePost.fulfilled, (state, action) => {
        state.posts = [action.payload, ...state.posts];
      }),
      builder.addCase(likePost.fulfilled, (state, action) => {
        const {userId, postId} = action.payload;
        const postIndex = state.posts.findIndex((post) => post.id === postId)

        if(postIndex !== -1)
          state.posts[postIndex].likes.push(userId)
      }),
      builder.addCase(removeLikeFromPost.fulfilled, (state, action) => {
        const {userId, postId} = action.payload;
        const postIndex = state.posts.findIndex((post) => post.id === postId)

        if(postIndex !== -1)
          state.posts[postIndex].likes = state.posts[postIndex].likes.filter(
            (id) => id !== userId
          )
      })
  },
});

export default postsSlice.reducer;