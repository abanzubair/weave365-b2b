import React from "react";
import { SharpStar } from "../../views/ReviewsPage.jsx";

export const TestimonialsColumn = ({
  className = "",
  testimonials = [],
  duration = 10,
}) => {
  return (
    <div 
      className={`testimonials-animated-column ${className}`}
      style={{ "--duration": `${duration}s` }}
    >
      <div className="testimonials-animated-column-inner">
        {/* Duplicate the array to create a seamless loop */}
        {[...new Array(2)].map((_, loopIdx) => (
          <React.Fragment key={loopIdx}>
            {testimonials.map((testimonial, i) => {
              const text = testimonial.comment || testimonial.text;
              const name = testimonial.reviewer_name || testimonial.name;
              const role = testimonial.business_name || testimonial.role;
              const rating = testimonial.rating || 5;
              const title = testimonial.title || "";
              const image = testimonial.image;

              return (
                <div 
                  className="testimonial-animated-card" 
                  key={`${loopIdx}-${i}`}
                >
                  <div className="testimonial-animated-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <SharpStar
                        key={star}
                        size={12}
                        fill={star <= rating ? "var(--gold)" : "none"}
                        stroke="var(--gold)"
                        className="testimonial-animated-star-icon"
                      />
                    ))}
                  </div>
                  {title && <h5 className="testimonial-animated-card-title">{title}</h5>}
                  <div className="testimonial-animated-text">"{text}"</div>
                  
                  <div className="testimonial-animated-author">
                    {image ? (
                      <img
                        width={36}
                        height={36}
                        src={image}
                        alt={name}
                        className="testimonial-animated-avatar-img"
                      />
                    ) : (
                      <div className="testimonial-animated-avatar-fallback">
                        {name ? name.charAt(0).toUpperCase() : "W"}
                      </div>
                    )}
                    <div className="testimonial-animated-meta">
                      <div className="testimonial-animated-name">{name}</div>
                      <div className="testimonial-animated-role">{role}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export const Testimonials = ({ testimonials = [] }) => {
  if (!testimonials || testimonials.length === 0) return null;

  // Split testimonials into 3 columns
  const firstColumn = [];
  const secondColumn = [];
  const thirdColumn = [];

  testimonials.forEach((testimonial, index) => {
    if (index % 3 === 0) {
      firstColumn.push(testimonial);
    } else if (index % 3 === 1) {
      secondColumn.push(testimonial);
    } else {
      thirdColumn.push(testimonial);
    }
  });

  // Ensure columns have items before rendering
  return (
    <section className="testimonials-animated-section">
      <div className="testimonials-animated-container">
        <div className="testimonials-animated-grid">
          {firstColumn.length > 0 && (
            <TestimonialsColumn testimonials={firstColumn} duration={25} />
          )}
          {secondColumn.length > 0 && (
            <TestimonialsColumn 
              testimonials={secondColumn} 
              className="column-md-visible" 
              duration={30} 
            />
          )}
          {thirdColumn.length > 0 && (
            <TestimonialsColumn 
              testimonials={thirdColumn} 
              className="column-lg-visible" 
              duration={28} 
            />
          )}
        </div>
      </div>
    </section>
  );
};
