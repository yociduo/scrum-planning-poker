DELETE ur1 FROM UserRooms ur1
INNER JOIN UserRooms ur2
WHERE
  ur1.id > ur2.id AND
  ur1.userId = ur2.userId AND
  ur1.roomId = ur2.roomId;
