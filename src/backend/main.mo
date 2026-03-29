import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Iter "mo:core/Iter";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  type NoteType = { #text; #checklist };

  type ChecklistItem = {
    id : Text;
    text : Text;
    checked : Bool;
    order : Nat;
  };

  type Note = {
    id : Text;
    noteType : NoteType;
    title : Text;
    body : Text;
    checklistItems : [ChecklistItem];
    color : Text;
    pinned : Bool;
    trashed : Bool;
    trashedAt : ?Int;
    reminder : ?Int;
    tags : [Text];
    locked : Bool;
    pinHash : ?Text;
    createdAt : Int;
    updatedAt : Int;
  };

  type UserSettings = {
    theme : Text;
    defaultColor : Text;
    viewMode : Text;
    language : Text;
  };

  public type UserProfile = {
    name : Text;
  };

  module Note {
    public func compare(a : Note, b : Note) : Order.Order {
      Text.compare(a.id, b.id);
    };
  };

  module ChecklistItem {
    public func compareByOrder(a : ChecklistItem, b : ChecklistItem) : Order.Order {
      Nat.compare(a.order, b.order);
    };
  };

  module NoteInput {
    public type Input = {
      noteType : NoteType;
      title : Text;
      body : Text;
      checklistItems : [ChecklistItem];
      color : Text;
      tags : [Text];
      reminder : ?Int;
      locked : Bool;
      pinHash : ?Text;
    };
  };

  module NoteUpdateInput {
    public type Input = {
      title : Text;
      body : Text;
      checklistItems : [ChecklistItem];
      color : Text;
      pinned : Bool;
      tags : [Text];
      reminder : ?Int;
      locked : Bool;
      pinHash : ?Text;
    };
  };

  module UserSettingsInput {
    public type Input = {
      theme : Text;
      defaultColor : Text;
      viewMode : Text;
      language : Text;
    };
  };

  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  let notes = Map.empty<Principal, Map.Map<Text, Note>>();
  let userSettings = Map.empty<Principal, UserSettings>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var nextId = 0;

  func requireAuth(caller : Principal) {
    if (caller.isAnonymous()) {
      Runtime.trap("Not authenticated");
    };
  };

  func getNextId() : Text {
    let id = nextId;
    nextId += 1;
    id.toText();
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    requireAuth(caller);
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    requireAuth(caller);
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    requireAuth(caller);
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getNotes() : async [Note] {
    requireAuth(caller);
    let userNotes = notes.get(caller);
    switch (userNotes) {
      case (null) { [] };
      case (?userNotes) {
        userNotes.values().toArray().filter(func(note) { not note.trashed });
      };
    };
  };

  public query ({ caller }) func getTrashedNotes() : async [Note] {
    requireAuth(caller);
    let userNotes = notes.get(caller);
    switch (userNotes) {
      case (null) { [] };
      case (?userNotes) {
        userNotes.values().toArray().filter(func(note) { note.trashed });
      };
    };
  };

  public query ({ caller }) func getNoteById(id : Text) : async Note {
    requireAuth(caller);
    switch (notes.get(caller)) {
      case (null) { Runtime.trap("Note not found") };
      case (?userNotes) {
        switch (userNotes.get(id)) {
          case (null) { Runtime.trap("Note not found") };
          case (?note) { note };
        };
      };
    };
  };

  public shared ({ caller }) func createNote(input : NoteInput.Input) : async Note {
    requireAuth(caller);
    let id = getNextId();
    let now = Time.now();
    let note : Note = {
      id;
      noteType = input.noteType;
      title = input.title;
      body = input.body;
      checklistItems = input.checklistItems;
      color = input.color;
      pinned = false;
      trashed = false;
      trashedAt = null;
      reminder = input.reminder;
      tags = input.tags;
      locked = input.locked;
      pinHash = input.pinHash;
      createdAt = now;
      updatedAt = now;
    };

    let userNotes = switch (notes.get(caller)) {
      case (null) { Map.empty<Text, Note>() };
      case (?map) { map };
    };

    userNotes.add(id, note);
    notes.add(caller, userNotes);
    note;
  };

  public shared ({ caller }) func updateNote(id : Text, input : NoteUpdateInput.Input) : async Note {
    requireAuth(caller);
    switch (notes.get(caller)) {
      case (null) { Runtime.trap("Note not found") };
      case (?userNotes) {
        switch (userNotes.get(id)) {
          case (null) { Runtime.trap("Note not found") };
          case (?existingNote) {
            let updatedNote = {
              existingNote with
              title = input.title;
              body = input.body;
              checklistItems = input.checklistItems;
              color = input.color;
              pinned = input.pinned;
              tags = input.tags;
              reminder = input.reminder;
              locked = input.locked;
              pinHash = input.pinHash;
              updatedAt = Time.now();
            };
            userNotes.add(id, updatedNote);
            notes.add(caller, userNotes);
            updatedNote;
          };
        };
      };
    };
  };

  public shared ({ caller }) func deleteNote(id : Text) : async () {
    requireAuth(caller);
    switch (notes.get(caller)) {
      case (null) { Runtime.trap("Note not found") };
      case (?userNotes) {
        switch (userNotes.get(id)) {
          case (null) { Runtime.trap("Note not found") };
          case (?note) {
            let trashedNote = {
              note with
              trashed = true;
              trashedAt = ?Time.now();
            };
            userNotes.add(id, trashedNote);
            notes.add(caller, userNotes);
          };
        };
      };
    };
  };

  public shared ({ caller }) func restoreNote(id : Text) : async () {
    requireAuth(caller);
    switch (notes.get(caller)) {
      case (null) { Runtime.trap("Note not found") };
      case (?userNotes) {
        switch (userNotes.get(id)) {
          case (null) { Runtime.trap("Note not found") };
          case (?note) {
            let restoredNote = {
              note with
              trashed = false;
              trashedAt = null;
            };
            userNotes.add(id, restoredNote);
            notes.add(caller, userNotes);
          };
        };
      };
    };
  };

  public shared ({ caller }) func permanentlyDeleteNote(id : Text) : async () {
    requireAuth(caller);
    switch (notes.get(caller)) {
      case (null) { Runtime.trap("Note not found") };
      case (?userNotes) {
        if (userNotes.containsKey(id)) {
          userNotes.remove(id);
          notes.add(caller, userNotes);
        } else {
          Runtime.trap("Note not found");
        };
      };
    };
  };

  public shared ({ caller }) func duplicateNote(id : Text) : async Note {
    requireAuth(caller);
    switch (notes.get(caller)) {
      case (null) { Runtime.trap("Note not found") };
      case (?userNotes) {
        switch (userNotes.get(id)) {
          case (null) { Runtime.trap("Note not found") };
          case (?note) {
            let newId = getNextId();
            let duplicatedNote = {
              note with
              id = newId;
              title = note.title # " (Copy)";
              pinned = false;
              trashed = false;
              trashedAt = null;
              createdAt = Time.now();
              updatedAt = Time.now();
            };
            userNotes.add(newId, duplicatedNote);
            notes.add(caller, userNotes);
            duplicatedNote;
          };
        };
      };
    };
  };

  public shared ({ caller }) func pinNote(id : Text, pinned : Bool) : async () {
    requireAuth(caller);
    switch (notes.get(caller)) {
      case (null) { Runtime.trap("Note not found") };
      case (?userNotes) {
        switch (userNotes.get(id)) {
          case (null) { Runtime.trap("Note not found") };
          case (?note) {
            let updatedNote = {
              note with
              pinned;
              updatedAt = Time.now();
            };
            userNotes.add(id, updatedNote);
            notes.add(caller, userNotes);
          };
        };
      };
    };
  };

  public shared ({ caller }) func changeColor(id : Text, color : Text) : async () {
    requireAuth(caller);
    switch (notes.get(caller)) {
      case (null) { Runtime.trap("Note not found") };
      case (?userNotes) {
        switch (userNotes.get(id)) {
          case (null) { Runtime.trap("Note not found") };
          case (?note) {
            let updatedNote = {
              note with
              color;
              updatedAt = Time.now();
            };
            userNotes.add(id, updatedNote);
            notes.add(caller, userNotes);
          };
        };
      };
    };
  };

  public shared ({ caller }) func getSettings() : async UserSettings {
    requireAuth(caller);
    switch (userSettings.get(caller)) {
      case (null) {
        {
          theme = "light";
          defaultColor = "yellow";
          viewMode = "grid";
          language = "en";
        };
      };
      case (?settings) { settings };
    };
  };

  public shared ({ caller }) func saveSettings(input : UserSettingsInput.Input) : async UserSettings {
    requireAuth(caller);
    let settings : UserSettings = {
      theme = input.theme;
      defaultColor = input.defaultColor;
      viewMode = input.viewMode;
      language = input.language;
    };
    userSettings.add(caller, settings);
    settings;
  };
};
