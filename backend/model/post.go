package model

import "gorm.io/gorm"

type Post struct {
	gorm.Model
	Title   string `binding:"required"`
	Content string `binding:"required"`
	Preview string `binding:"required"`
}

func (p *Post) CreatePost() error {
	err := db.Create(&p).Error
	if err != nil {
		return err
	}
	return nil
}

func (p *Post) GetPosts() ([]Post, error) {
	var posts []Post
	err := db.Find(&posts).Error
	if err != nil {
		return nil, err
	}
	return posts, nil
}

func (p *Post) GetPostById(id string) (Post, error) {
	var post Post

	err := db.Where("id =?", id).First(&post).Error
	if err != nil {
		return Post{}, err
	}
	return post, nil
}
