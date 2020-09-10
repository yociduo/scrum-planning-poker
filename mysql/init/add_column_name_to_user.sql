ALTER TABLE `scrum_poker`.`users`
ADD COLUMN `name` VARCHAR(255) NOT NULL DEFAULT '' AFTER `id`;
